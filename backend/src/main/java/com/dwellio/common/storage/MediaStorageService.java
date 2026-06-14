package com.dwellio.common.storage;

import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@RequiredArgsConstructor
public class MediaStorageService {

    private final CloudinaryMediaStorage cloudinary;

    public StoredMedia storeImage(MultipartFile file, String folder, String localFilename) throws IOException {
        CloudinaryMediaStorage.UploadResult uploaded = cloudinary.upload(file, folder);
        return new StoredMedia(uploaded.url(), uploaded.publicId(), true);
    }

    public StoredMedia storeRaw(byte[] data, String folder, String filename) throws IOException {
        CloudinaryMediaStorage.UploadResult uploaded = cloudinary.uploadRaw(data, folder, filename);
        return new StoredMedia(uploaded.url(), uploaded.publicId(), true);
    }

    public byte[] downloadRaw(String secureUrl) throws IOException {
        return cloudinary.downloadRaw(secureUrl);
    }

    public record StoredMedia(String url, String publicId, boolean cloudinary) {
    }
}
