import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface ProgressUpdate {
  videoId: string;
  stage:
    | 'uploading'
    | 'validating'
    | 'processing'
    | 'encoding'
    | 'finalizing'
    | 'completed'
    | 'error';
  uploadProgress?: number;
  processingProgress?: number;
  overallProgress: number;
  currentTask?: string;
  error?: string;
  speed?: number;
  eta?: number;
  fileSize?: number;
  uploadedBytes?: number;
  timestamp?: number;
}

interface UploadStartEvent {
  uploadId: string;
  userId: string;
  fileSize: number;
  timestamp: number;
}

interface ClientInfo {
  userId?: string;
  uploadRooms: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class UploadProgressGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(UploadProgressGateway.name);
  private clients = new Map<string, ClientInfo>();

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, {
      uploadRooms: new Set(),
    });

    // Send connection confirmation
    client.emit('connected', {
      message: 'Connected to upload progress server',
      timestamp: Date.now(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clean up client rooms
    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      // Leave all upload rooms
      for (const room of clientInfo.uploadRooms) {
        void client.leave(room);
      }
    }

    this.clients.delete(client.id);
  }

  @SubscribeMessage('join-upload')
  handleJoinUpload(
    @MessageBody() uploadId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `upload-${uploadId}`;
    void client.join(roomName);

    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      clientInfo.uploadRooms.add(roomName);
    }

    this.logger.log(`Client ${client.id} joined upload room: ${roomName}`);

    client.emit('joined-upload', {
      uploadId,
      room: roomName,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('leave-upload')
  handleLeaveUpload(
    @MessageBody() uploadId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `upload-${uploadId}`;
    void client.leave(roomName);

    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      clientInfo.uploadRooms.delete(roomName);
    }

    this.logger.log(`Client ${client.id} left upload room: ${roomName}`);
  }

  @SubscribeMessage('join-user-uploads')
  handleJoinUserUploads(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `user-uploads-${userId}`;
    void client.join(roomName);

    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      clientInfo.userId = userId;
    }

    this.logger.log(
      `Client ${client.id} joined user uploads room: ${roomName}`,
    );

    client.emit('joined-user-uploads', {
      userId,
      room: roomName,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('leave-user-uploads')
  handleLeaveUserUploads(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `user-uploads-${userId}`;
    void client.leave(roomName);

    this.logger.log(`Client ${client.id} left user uploads room: ${roomName}`);
  }

  @SubscribeMessage('upload-start')
  handleUploadStart(@MessageBody() data: UploadStartEvent) {
    this.logger.log(`Upload started: ${data.uploadId} by user ${data.userId}`);

    // Broadcast to upload room
    const uploadRoom = `upload-${data.uploadId}`;
    this.server.to(uploadRoom).emit('upload-started', {
      uploadId: data.uploadId,
      userId: data.userId,
      fileSize: data.fileSize,
      timestamp: data.timestamp,
    });

    // Broadcast to user uploads room
    const userRoom = `user-uploads-${data.userId}`;
    this.server.to(userRoom).emit('user-upload-started', {
      uploadId: data.uploadId,
      fileSize: data.fileSize,
      timestamp: data.timestamp,
    });
  }

  @SubscribeMessage('upload-progress-update')
  handleUploadProgressUpdate(
    @MessageBody() progress: ProgressUpdate & { uploadId: string },
  ) {
    const { uploadId, ...progressData } = progress;

    // Broadcast to specific upload room
    const uploadRoom = `upload-${uploadId}`;
    this.server.to(uploadRoom).emit('upload-progress', {
      ...progressData,
      videoId: uploadId,
      timestamp: progress.timestamp || Date.now(),
    });

    // Also broadcast to user uploads room if we can determine the user
    // This would require tracking userId per upload, which we could add to the upload start event
    this.logger.debug(
      `Progress update for upload ${uploadId}: ${progressData.stage} - ${progressData.overallProgress}%`,
    );
  }

  // Method to broadcast progress from the backend services
  broadcastProgress(
    uploadId: string,
    userId: string,
    progress: ProgressUpdate,
  ) {
    const uploadRoom = `upload-${uploadId}`;
    const userRoom = `user-uploads-${userId}`;

    const progressData = {
      ...progress,
      videoId: uploadId,
      timestamp: Date.now(),
    };

    // Send to specific upload room
    this.server.to(uploadRoom).emit('upload-progress', progressData);

    // Send to user's uploads room
    this.server.to(userRoom).emit('user-upload-progress', progressData);

    this.logger.debug(
      `Broadcasting progress for ${uploadId}: ${progress.stage} - ${progress.overallProgress}%`,
    );
  }

  // Method to broadcast to all connected clients (for global notifications)
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: Date.now(),
    });
  }

  // Method to get connected clients count
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  // Method to get active upload rooms
  getActiveUploads(): string[] {
    const activeUploads = new Set<string>();

    this.clients.forEach((clientInfo) => {
      clientInfo.uploadRooms.forEach((room) => {
        if (room.startsWith('upload-')) {
          activeUploads.add(room.replace('upload-', ''));
        }
      });
    });

    return Array.from(activeUploads);
  }
}
