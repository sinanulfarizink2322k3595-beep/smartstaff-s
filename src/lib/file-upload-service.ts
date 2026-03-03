/**
 * Profile Image Upload Service
 * Handles uploading and managing profile photos using Supabase Storage
 */

import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "profile-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Initialize storage bucket (run once)
 */
export const initializeProfileBucket = async () => {
    try {
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

        if (!bucketExists) {
            await supabase.storage.createBucket(BUCKET_NAME, {
                public: true,
                fileSizeLimit: MAX_FILE_SIZE,
            });
            console.log("Profile bucket created");
        }
    } catch (error) {
        console.error("Bucket initialization error:", error);
    }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (
    userId: string,
    file: File
): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
        // Validate file
        if (!file) {
            return { success: false, error: "No file selected" };
        }

        if (file.size > MAX_FILE_SIZE) {
            return {
                success: false,
                error: `File size must be less than 5MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
            };
        }

        if (!file.type.startsWith("image/")) {
            return { success: false, error: "File must be an image (JPG, PNG, etc.)" };
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${userId}/${fileName}`;

        // Delete old images for this user
        try {
            const { data: files } = await supabase.storage
                .from(BUCKET_NAME)
                .list(`profiles/${userId}`);

            if (files && files.length > 0) {
                await Promise.all(
                    files.map((f) =>
                        supabase.storage
                            .from(BUCKET_NAME)
                            .remove([`profiles/${userId}/${f.name}`])
                    )
                );
            }
        } catch (error) {
            console.warn("Could not delete old images:", error);
        }

        // Upload new image
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (uploadError) {
            return { success: false, error: uploadError.message };
        }

        // Get public URL
        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        const imageUrl = data.publicUrl;

        // TODO: Once profile_image_url column is added to profiles table via migration,
        // uncomment the code below to update the database
        // const { error: updateError } = await supabase
        //   .from("profiles")
        //   .update({ profile_image_url: imageUrl })
        //   .eq("id", userId);

        return { success: true, url: imageUrl };
    } catch (error) {
        console.error("Upload error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        };
    }
};

/**
 * Delete profile image
 */
export const deleteProfileImage = async (userId: string) => {
    try {
        const { data: files } = await supabase.storage
            .from(BUCKET_NAME)
            .list(`profiles/${userId}`);

        if (files && files.length > 0) {
            await Promise.all(
                files.map((f) =>
                    supabase.storage
                        .from(BUCKET_NAME)
                        .remove([`profiles/${userId}/${f.name}`])
                )
            );
        }

        // TODO: Once profile_image_url column is added to profiles table via migration,
        // uncomment the code below to clear the database
        // await supabase
        //   .from("profiles")
        //   .update({ profile_image_url: null })
        //   .eq("id", userId);

        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, error };
    }
};

/**
 * Get profile image URL
 */
export const getProfileImageUrl = (userId: string): string | null => {
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`profiles/${userId}`);

    return data?.publicUrl || null;
};

/**
 * Compress image before upload
 */
export const compressImage = async (
    file: File,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.8
): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        }
                    },
                    "image/jpeg",
                    quality
                );
            };
        };
    });
};

/**
 * Generate avatar URL from initials
 */
export const generateAvatarUrl = (name: string, color: string = "blue"): string => {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return `https://api.dicebear.com/7.x/initials/svg?seed=${initials}&backgroundColor=${color}`;
};
