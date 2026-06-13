package com.dwellio.review.repository;

import com.dwellio.domain.entity.ReviewReport;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewReportRepository extends JpaRepository<ReviewReport, UUID> {
}
