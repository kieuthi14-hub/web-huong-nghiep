@echo off
chcp 65001 >nul
title Cập Nhật Code Lên Web SocraCareer
cd /d "%~dp0"
echo ===================================================================
echo    DANG TIEN HANH DONG BO VA DAY CODE SUA LOI LEN GITHUB & VERCEL
echo ===================================================================
echo.
git add .
git commit -m "fix: khôi phục câu hỏi Socrates tự nhiên, xóa bỏ điểm giả lập 25 và 27.5, fix sandbox và bước 5"
git push origin main
echo.
echo ===================================================================
echo    [THANH CONG] DA DAY TOAN BO CODE LEN GITHUB!
echo    Vercel dang tu dong build ban web moi nhat (mat khoang 1-2 phut).
echo.
echo    HUONG DAN XEM BAN MOI TREN TRINH DUYET:
echo    1. Mo web tren trinh duyet, nhan giu Ctrl + Shift + R (hoac Ctrl + F5)
echo       de xoa sach cache trinh duyet cu.
echo    2. Vao Vong 2: Bam nut 'Bat dau lai' o goc tren de lam moi hoi thoai!
echo ===================================================================
echo.
pause
