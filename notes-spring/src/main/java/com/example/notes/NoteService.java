package com.example.notes;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class NoteService {

    public void checkTitle(String title) {

        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "标题不能为空"
            );
        }

    }


    public NoteService(String message) {
        System.out.println(message);
    }
}
