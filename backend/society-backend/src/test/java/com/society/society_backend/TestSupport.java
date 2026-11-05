package com.society.society_backend;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public final class TestSupport {

    private TestSupport() {
    }

    // Passes only if the call fails with our deliberate error and the expected status code.
    public static void expectStatus(ThrowingCallable call, int status) {
        assertThatThrownBy(call)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        ex -> assertThat(ex.getStatusCode().value()).isEqualTo(status));
    }
}
