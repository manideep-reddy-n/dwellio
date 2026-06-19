package com.dwellio.admin.dto;

import java.util.List;

public record AdminSearchResponse(
        String query,
        List<AdminSearchHit> users,
        List<AdminSearchHit> organizations,
        List<AdminSearchHit> residents,
        List<AdminSearchHit> payments,
        List<AdminSearchHit> complaints,
        List<AdminSearchHit> reviews
) {
    public record AdminSearchHit(
            String id,
            String type,
            String title,
            String subtitle,
            String href
    ) {
    }
}
