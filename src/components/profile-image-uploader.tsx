import { useState, useRef } from "react";
import { Upload, X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadProfileImage, deleteProfileImage, compressImage } from "@/lib/file-upload-service";

interface ProfileImageUploaderProps {
    userId: string;
    currentImageUrl?: string;
    onImageUploaded?: (url: string) => void;
    disabled?: boolean;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
    userId,
    currentImageUrl,
    onImageUploaded,
    disabled = false,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);

            // Show preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Compress image
            const compressedFile = await compressImage(file);

            // Upload
            const result = await uploadProfileImage(userId, compressedFile);

            if (result.success && result.url) {
                toast.success("Profile photo updated!");
                setPreview(result.url);
                onImageUploaded?.(result.url);
            } else {
                toast.error(result.error || "Upload failed");
                setPreview(currentImageUrl || null);
            }
        } catch (error) {
            toast.error("Upload failed");
            setPreview(currentImageUrl || null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async () => {
        try {
            setIsLoading(true);
            const result = await deleteProfileImage(userId);

            if (result.success) {
                toast.success("Profile photo removed");
                setPreview(null);
                onImageUploaded?.("");
            } else {
                toast.error("Failed to remove photo");
            }
        } catch (error) {
            toast.error("Failed to remove photo");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Image Preview */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden border-4 border-white shadow-lg">
                {preview ? (
                    <img
                        src={preview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                        {initials(userId)}
                    </div>
                )}

                {/* Remove Button */}
                {preview && !isLoading && (
                    <button
                        onClick={handleRemove}
                        disabled={disabled}
                        className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}
            </div>

            {/* Upload Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={disabled || isLoading}
                className="hidden"
            />

            {/* Upload Button */}
            <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading}
                variant="outline"
                className="gap-2"
            >
                <Upload className="w-4 h-4" />
                {isLoading ? "Uploading..." : "Change Photo"}
            </Button>

            {/* Info Text */}
            <p className="text-xs text-muted-foreground text-center max-w-xs">
                JPG, PNG up to 5MB. Image will be compressed automatically.
            </p>
        </div>
    );
};

// Helper function to get initials
const initials = (id: string): string => {
    return id.substring(0, 2).toUpperCase();
};
