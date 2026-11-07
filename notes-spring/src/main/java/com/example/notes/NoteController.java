package com.example.notes;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class NoteController {

    @PostMapping("/notes/preview")
    public NoteRequest preview(@RequestBody NoteRequest request) {

           NoteService noteService = new NoteService("测试构造方法传参数");
           noteService.checkTitle(request.title);
           return request;

    }


}
