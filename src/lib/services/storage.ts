// Service de stockage AWS S3 pour les fichiers audio et autres assets
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
export interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}
export interface UploadResult {
  url: string;
  key: string;
  size: number;
  contentType: string;
}
export interface PresignedUrlOptions {
  expiresIn?: number; // en secondes
  contentType?: string;
  metadata?: Record<string, string>;
}
export class StorageService {
  private s3Client: S3Client;
  private config: StorageConfig;
  constructor(config: StorageConfig) {
    this.config = config;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  /**
   * Upload un fichier vers S3
   */
  async uploadFile(
    file: File | Buffer,
    key: string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
      isPublic?: boolean;
    }
  ): Promise<UploadResult> {
    try {
      const buffer = file instanceof File ? await file.arrayBuffer() : file;
      const contentType = options?.contentType ||
        (file instanceof File ? file.type : 'application/octet-stream');
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: contentType,
        Metadata: options?.metadata,
        ACL: options?.isPublic ? 'public-read' : 'private',
      });
      await this.s3Client.send(command);
      const url = options?.isPublic
        ? `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`
        : await this.getSignedUrl(key, { expiresIn: 3600 }); // 1 heure par défaut
      return {
        url,
        key,
        size: buffer.byteLength,
        contentType,
      };
    } catch (error) {
      console.error('Erreur upload S3:', error);
      throw new Error('Erreur lors de l\'upload du fichier');
    }
  }
  /**
   * Upload un fichier audio avec optimisations
   */
  async uploadAudio(
    audioFile: File | Blob,
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      // Générer une clé unique pour le fichier audio
      const timestamp = Date.now();
      const extension = audioFile instanceof File
        ? audioFile.name.split('.').pop() || 'webm'
        : 'webm';
      const key = `audio/${userId}/${conversationId}/${messageId}_${timestamp}.${extension}`;
      const buffer = audioFile instanceof File
        ? await audioFile.arrayBuffer()
        : await audioFile.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: audioFile.type || 'audio/webm',
        Metadata: {
          userId,
          conversationId,
          messageId,
          uploadedAt: new Date().toISOString(),
        },
        // Optimisations pour l'audio
        StorageClass: 'STANDARD_IA', // Accès peu fréquent
        ServerSideEncryption: 'AES256',
      });
      await this.s3Client.send(command);
      // Générer une URL signée valide 24h
      const url = await this.getSignedUrl(key, { expiresIn: 86400 });
      return {
        url,
        key,
        size: buffer.byteLength,
        contentType: audioFile.type || 'audio/webm',
      };
    } catch (error) {
      console.error('Erreur upload audio S3:', error);
      throw new Error('Erreur lors de l\'upload du fichier audio');
    }
  }
  /**
   * Génère une URL signée pour accéder à un fichier
   */
  async getSignedUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: options?.expiresIn || 3600, // 1 heure par défaut
      });
      return url;
    } catch (error) {
      console.error('Erreur génération URL signée:', error);
      throw new Error('Erreur lors de la génération de l\'URL');
    }
  }
  /**
   * Génère une URL signée pour l'upload direct depuis le client
   */
  async getPresignedUploadUrl(
    key: string,
    options?: PresignedUrlOptions
  ): Promise<{
    url: string;
    fields: Record<string, string>;
  }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
      });
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: options?.expiresIn || 300, // 5 minutes par défaut
      });
      return {
        url,
        fields: {
          'Content-Type': options?.contentType || 'application/octet-stream',
          ...options?.metadata,
        },
      };
    } catch (error) {
      console.error('Erreur génération URL upload:', error);
      throw new Error('Erreur lors de la génération de l\'URL d\'upload');
    }
  }
  /**
   * Supprime un fichier de S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Erreur suppression S3:', error);
      throw new Error('Erreur lors de la suppression du fichier');
    }
  }
  /**
   * Vérifie si un fichier existe
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   * Obtient les métadonnées d'un fichier
   */
  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata: Record<string, string>;
  } | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata || {},
      };
    } catch (error) {
      console.error('Erreur métadonnées S3:', error);
      return null;
    }
  }
  /**
   * Nettoie les fichiers anciens (pour maintenance)
   */
  async cleanupOldFiles(olderThanDays: number = 30): Promise<number> {
    try {
      // Cette fonction nécessiterait l'implémentation de listObjects
      // et la suppression en lot pour être complète
      console.log(`Nettoyage des fichiers de plus de ${olderThanDays} jours`);
      return 0; // Placeholder
    } catch (error) {
      console.error('Erreur nettoyage S3:', error);
      throw new Error('Erreur lors du nettoyage');
    }
  }
}
// Factory function pour créer une instance
export function createStorageService(): StorageService {
  const config: StorageConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'voicecoop-dev',
  };
  if (!config.accessKeyId || !config.secretAccessKey) {
    console.warn('AWS credentials non configurées - mode simulation');
  }
  return new StorageService(config);
}
// Service de simulation pour le développement
export class MockStorageService {
  async uploadFile(): Promise<UploadResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      url: 'https://mock-storage.com/file.mp3',
      key: 'mock-key',
      size: 1024,
      contentType: 'audio/mp3',
    };
  }
  async uploadAudio(): Promise<UploadResult> {
    return this.uploadFile();
  }
  async getSignedUrl(): Promise<string> {
    return 'https://mock-storage.com/signed-url';
  }
  async deleteFile(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  async fileExists(): Promise<boolean> {
    return true;
  }
}
// Instance singleton
export const storageService = process.env.NODE_ENV === 'development' && !process.env.AWS_ACCESS_KEY_ID
  ? new MockStorageService() as any
  : createStorageService();
// Types d'export
export type {
  StorageConfig,
  UploadResult,
  PresignedUrlOptions,
};