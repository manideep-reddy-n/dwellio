package com.dwellio.admin.dto;

import java.util.List;

public record AdminPagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static <T> AdminPagedResponse<T> of(List<T> content, int page, int size, long totalElements) {
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        return new AdminPagedResponse<>(content, page, size, totalElements, totalPages);
    }
}
