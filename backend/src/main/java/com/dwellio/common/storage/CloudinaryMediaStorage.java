package com.dwellio.common.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class CloudinaryMediaStorage {

    private final Cloudinary cloudinary;

    public CloudinaryMediaStorage(@Value("${dwellio.cloudinary.url:}") String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) {
            throw new IllegalStateException(
                    "dwellio.cloudinary.url (CLOUDINARY_URL) is required — local file storage has been removed");
        }
        this.cloudinary = new Cloudinary(cloudinaryUrl);
    }

    public UploadResult upload(MultipartFile file, String folder) throws IOException {
        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", "dwellio/" + folder, "resource_type", "image")
        );
        return new UploadResult(
                (String) result.get("secure_url"),
                (String) result.get("public_id")
        );
    }

    public byte[] downloadRaw(String secureUrl) throws IOException {
        try {
            return java.net.URI.create(secureUrl).toURL().openStream().readAllBytes();
        } catch (IOException exception) {
            String publicId = extractPublicId(secureUrl);
            if (publicId == null) {
                throw exception;
            }
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> resource = cloudinary.api().resource(
                        publicId,
                        ObjectUtils.asMap("resource_type", "raw")
                );
                String url = (String) resource.get("secure_url");
                if (url == null) {
                    throw exception;
                }
                return java.net.URI.create(url).toURL().openStream().readAllBytes();
            } catch (Exception apiError) {
                throw exception;
            }
        }
    }

    private static String extractPublicId(String secureUrl) {
        int uploadIndex = secureUrl.indexOf("/upload/");
        if (uploadIndex < 0) {
            return null;
        }
        String path = secureUrl.substring(uploadIndex + "/upload/".length());
        if (path.matches("^v\\d+/.*")) {
            path = path.replaceFirst("^v\\d+/", "");
        }
        int dot = path.lastIndexOf('.');
        return dot > 0 ? path.substring(0, dot) : path;
    }

    public UploadResult uploadRaw(byte[] data, String folder, String filename) throws IOException {
        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(
                data,
                ObjectUtils.asMap(
                        "folder", "dwellio/" + folder,
                        "resource_type", "raw",
                        "public_id", filename.replace(".", "_")
                )
        );
        return new UploadResult(
                (String) result.get("secure_url"),
                (String) result.get("public_id")
        );
    }

    public record UploadResult(String url, String publicId) {
    }
}
