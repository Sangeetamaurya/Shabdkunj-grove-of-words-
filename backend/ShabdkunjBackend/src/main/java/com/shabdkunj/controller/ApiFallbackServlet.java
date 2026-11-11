package com.shabdkunj.controller;

import com.shabdkunj.util.JsonUtil;
import java.io.IOException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ApiFallbackServlet extends HttpServlet {
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Not found");
    }
}
