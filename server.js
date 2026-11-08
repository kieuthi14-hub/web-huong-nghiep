// ==============================================================================
// BACKEND CAN THIỆP AI SOCRATES - ĐỀ TÀI NGHIÊN CỨU KHOA HỌC KỸ THUẬT (KHKT)
// HỆ THỐNG ĐIỀU CHUẨN NHẬN THỨC NGHỀ NGHIỆP THÍCH ỨNG (SOCRACAREER)
// File: server.js (ESM Module - Đồng bộ 100% với api/socrates-chat.js)
// ==============================================================================

import express from 'express';
import cors from 'cors';
import socratesHandler from './api/socrates-chat.js';

const app = express();
app.use(cors());
app.use(express.json());

// Đồng bộ 100% logic xử lý giữa Local Express và Vercel Serverless Function
app.all('/api/socrates-chat', (req, res) => socratesHandler(req, res));
app.all('/api/chat', (req, res) => socratesHandler(req, res));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SocraCareer KHKT] Server AI Socrates đang vận hành tại cổng ${PORT}`);
});
