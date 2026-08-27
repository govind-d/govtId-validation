package com.govid.screening.api;

import com.govid.screening.api.dto.CaseSummary;
import com.govid.screening.api.dto.DecisionRequest;
import com.govid.screening.domain.AuditEvent;
import com.govid.screening.domain.DocumentType;
import com.govid.screening.domain.ScreeningCase;
import com.govid.screening.pipeline.ImageStore;
import com.govid.screening.pipeline.ScreeningService;
import com.govid.screening.repository.AuditEventRepository;
import com.govid.screening.repository.ScreeningCaseRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/** Officer-facing screening API. */
@RestController
@RequestMapping("/api/screenings")
public class ScreeningController {

    private final ScreeningService screeningService;
    private final ScreeningCaseRepository caseRepository;
    private final AuditEventRepository auditRepository;
    private final ImageStore imageStore;

    public ScreeningController(ScreeningService screeningService,
                               ScreeningCaseRepository caseRepository,
                               AuditEventRepository auditRepository,
                               ImageStore imageStore) {
        this.screeningService = screeningService;
        this.caseRepository = caseRepository;
        this.auditRepository = auditRepository;
        this.imageStore = imageStore;
    }

    /**
     * Screens one presented document.
     *
     * @param document    the document image; required
     * @param live        live capture of the traveller, enabling Module 4; optional
     * @param text        text the caller already holds, such as an e-passport chip read.
     *                    When present it is trusted over pixel OCR.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ScreeningCase screen(
            @RequestPart("document") MultipartFile document,
            @RequestPart(value = "live", required = false) MultipartFile live,
            @RequestParam(value = "documentType", defaultValue = "UNKNOWN") DocumentType documentType,
            @RequestParam(value = "checkpointId", required = false) String checkpointId,
            @RequestParam(value = "laneId", required = false) String laneId,
            @RequestParam(value = "officerId", required = false) String officerId,
            @RequestParam(value = "text", required = false) String text) throws IOException {

        if (document == null || document.isEmpty()) {
            throw new IllegalArgumentException("A document image is required.");
        }

        return screeningService.screen(new ScreeningService.ScreeningRequest(
                document.getBytes(),
                document.getContentType(),
                live == null || live.isEmpty() ? null : live.getBytes(),
                live == null ? null : live.getContentType(),
                documentType,
                checkpointId,
                laneId,
                officerId,
                text));
    }

    @GetMapping
    public Page<CaseSummary> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return caseRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, Math.min(size, 100)))
                .map(CaseSummary::from);
    }

    @GetMapping("/{reference}")
    public ScreeningCase get(@PathVariable String reference) {
        return caseRepository.findByCaseReference(reference)
                .or(() -> caseRepository.findById(reference))
                .orElseThrow(() -> new IllegalArgumentException("Unknown case " + reference));
    }

    @GetMapping("/{reference}/audit")
    public List<AuditEvent> audit(@PathVariable String reference) {
        ScreeningCase screeningCase = get(reference);
        return auditRepository.findByCaseIdOrderByOccurredAtAsc(screeningCase.getId());
    }

    /**
     * Serves a stored evidence image.
     *
     * @param kind {@code document} or {@code live}
     */
    @GetMapping("/{reference}/images/{kind}")
    public ResponseEntity<byte[]> image(@PathVariable String reference, @PathVariable String kind) {
        ScreeningCase screeningCase = get(reference);
        String imageId = switch (kind) {
            case "document" -> screeningCase.getDocumentImageId();
            case "live" -> screeningCase.getLiveCaptureImageId();
            default -> throw new IllegalArgumentException("Unknown image kind " + kind);
        };
        if (imageId == null) {
            return ResponseEntity.notFound().build();
        }
        ImageStore.StoredImage image = imageStore.load(imageId);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        image.contentType() == null ? "application/octet-stream" : image.contentType()))
                .body(image.bytes());
    }

    @PostMapping("/{reference}/decision")
    public ScreeningCase decide(@PathVariable String reference,
                                @Valid @RequestBody DecisionRequest request) {
        ScreeningCase screeningCase = get(reference);
        return screeningService.recordDecision(
                screeningCase.getId(), request.decision(), request.officerId(), request.notes());
    }
}
