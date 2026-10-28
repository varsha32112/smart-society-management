package com.society.society_backend.service;

import com.society.society_backend.dto.NoticeRequest;
import com.society.society_backend.dto.NoticeResponse;
import com.society.society_backend.entity.Notice;
import com.society.society_backend.entity.User;
import com.society.society_backend.repository.NoticeRepository;
import com.society.society_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    public NoticeService(NoticeRepository noticeRepository, UserRepository userRepository) {
        this.noticeRepository = noticeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public NoticeResponse publish(NoticeRequest request, String adminEmail) {
        if (request.title() == null || request.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (request.title().length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must be 150 characters or fewer");
        }
        if (request.content() == null || request.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content is required");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Notice notice = new Notice();
        notice.setTitle(request.title().trim());
        notice.setContent(request.content().trim());
        notice.setPostedBy(admin);

        return toResponse(noticeRepository.save(notice));
    }

    public List<NoticeResponse> list() {
        return noticeRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public void delete(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found");
        }
        noticeRepository.deleteById(id);
    }

    private NoticeResponse toResponse(Notice n) {
        return new NoticeResponse(n.getId(), n.getTitle(), n.getContent(),
                n.getPostedBy().getFullName(), n.getCreatedAt());
    }
}