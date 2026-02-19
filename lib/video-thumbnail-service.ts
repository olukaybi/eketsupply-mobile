import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from './supabase';

/**
 * Service for generating and caching video thumbnails
 */
export class VideoThumbnailService {
  /**
   * Generate thumbnail from video URI
   * @param videoUri Local video file URI
   * @param timeMs Time in milliseconds to capture thumbnail (default: 1000ms)
   * @returns Local URI of generated thumbnail
   */
  static async generateThumbnail(
    videoUri: string,
    timeMs: number = 1000
  ): Promise<string | null> {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: timeMs,
        quality: 0.8,
      });

      return uri;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  /**
   * Upload thumbnail to Supabase storage
   * @param thumbnailUri Local thumbnail URI
   * @param artisanId Artisan ID for folder organization
   * @returns Public URL of uploaded thumbnail
   */
  static async uploadThumbnail(
    thumbnailUri: string,
    artisanId: string
  ): Promise<string | null> {
    try {
      // Read thumbnail file
      const response = await fetch(thumbnailUri);
      const blob = await response.blob();

      // Generate unique filename
      const fileName = `${artisanId}/${Date.now()}_thumb.jpg`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('video-testimonials')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (error) {
        console.error('Error uploading thumbnail:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('video-testimonials')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadThumbnail:', error);
      return null;
    }
  }

  /**
   * Generate and upload thumbnail for a video
   * @param videoUri Local video URI
   * @param artisanId Artisan ID
   * @returns Public URL of uploaded thumbnail
   */
  static async processVideoThumbnail(
    videoUri: string,
    artisanId: string
  ): Promise<string | null> {
    try {
      // Generate thumbnail
      const thumbnailUri = await this.generateThumbnail(videoUri);
      if (!thumbnailUri) {
        return null;
      }

      // Upload thumbnail
      const thumbnailUrl = await this.uploadThumbnail(thumbnailUri, artisanId);
      return thumbnailUrl;
    } catch (error) {
      console.error('Error processing video thumbnail:', error);
      return null;
    }
  }

  /**
   * Update video testimonial with thumbnail URL
   * @param testimonialId Video testimonial ID
   * @param thumbnailUrl Thumbnail URL
   */
  static async updateTestimonialThumbnail(
    testimonialId: string,
    thumbnailUrl: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('video_testimonials')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', testimonialId);

      if (error) {
        console.error('Error updating testimonial thumbnail:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTestimonialThumbnail:', error);
      return false;
    }
  }

  /**
   * Get cached thumbnail URL for a video testimonial
   * @param testimonialId Video testimonial ID
   * @returns Cached thumbnail URL or null
   */
  static async getCachedThumbnail(testimonialId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('video_testimonials')
        .select('thumbnail_url')
        .eq('id', testimonialId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.thumbnail_url;
    } catch (error) {
      console.error('Error getting cached thumbnail:', error);
      return null;
    }
  }

  /**
   * Process thumbnails for videos that don't have them
   * This can be run as a background job to backfill missing thumbnails
   */
  static async processUnprocessedVideos(limit: number = 10): Promise<number> {
    try {
      // Get videos without thumbnails
      const { data: videos, error } = await supabase
        .from('video_testimonials')
        .select('id, video_url, artisan_id')
        .is('thumbnail_url', null)
        .limit(limit);

      if (error || !videos) {
        console.error('Error fetching unprocessed videos:', error);
        return 0;
      }

      let processedCount = 0;
      for (const video of videos) {
        try {
          // Generate and upload thumbnail
          const thumbnailUrl = await this.processVideoThumbnail(
            video.video_url,
            video.artisan_id
          );

          if (thumbnailUrl) {
            // Update video testimonial
            await this.updateTestimonialThumbnail(video.id, thumbnailUrl);
            processedCount++;
          }

          // Small delay to avoid overwhelming the system
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error processing video ${video.id}:`, error);
        }
      }

      return processedCount;
    } catch (error) {
      console.error('Error in processUnprocessedVideos:', error);
      return 0;
    }
  }

  /**
   * Delete thumbnail from storage
   * @param thumbnailUrl Thumbnail URL to delete
   */
  static async deleteThumbnail(thumbnailUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = thumbnailUrl.split('/video-testimonials/');
      if (urlParts.length < 2) {
        return false;
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('video-testimonials')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting thumbnail:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteThumbnail:', error);
      return false;
    }
  }
}
