package com.dwellio.complaint.repository;

import com.dwellio.domain.entity.ComplaintAttachment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComplaintAttachmentRepository extends JpaRepository<ComplaintAttachment, UUID> {

    @Query("""
            SELECT a FROM ComplaintAttachment a
            WHERE a.complaint.id = :complaintId
            ORDER BY a.createdAt ASC
            """)
    List<ComplaintAttachment> findAllByComplaintId(@Param("complaintId") UUID complaintId);

    @Query("""
            SELECT a FROM ComplaintAttachment a
            WHERE a.id = :attachmentId
              AND a.complaint.id = :complaintId
            """)
    Optional<ComplaintAttachment> findByIdAndComplaintId(
            @Param("attachmentId") UUID attachmentId,
            @Param("complaintId") UUID complaintId
    );
}
