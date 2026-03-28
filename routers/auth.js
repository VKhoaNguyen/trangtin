var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var TaiKhoan = require('../models/taikhoan');

// ========================================================
// 1. CẤU HÌNH THƯ VIỆN GOOGLE API (CODE MỚI THÊM)
// ========================================================
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config(); // Kích hoạt đọc file .env

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
      try {
          var email = profile.emails[0].value;
          // Kiểm tra xem email này đã đăng ký trong web chưa
          var taikhoan = await TaiKhoan.findOne({ Email: email }).exec();
          
          if (!taikhoan) {
              // Lần đầu đăng nhập: Tự động tạo tài khoản mới
              var salt = bcrypt.genSaltSync(10);
              var data = {
                  HoVaTen: profile.displayName,
                  Email: email,
                  HinhAnh: profile.photos[0].value,
                  // Tự động lấy chữ trước a còng (@) làm tên đăng nhập
                  TenDangNhap: email.split('@')[0], 
                  // Lấy ID của Google băm ra làm mật khẩu mặc định cho an toàn
                  MatKhau: bcrypt.hashSync(profile.id, salt), 
                  QuyenHan: 'user',
                  KichHoat: 1
              };
              taikhoan = await TaiKhoan.create(data);
          }
          return cb(null, taikhoan); // Trả tài khoản về cho hệ thống
      } catch (err) {
          return cb(err, null);
      }
  }
));
// ========================================================


// GET: Đăng ký
router.get('/dangky', async (req, res) => {
    res.render('dangky', {
        title: 'Đăng ký tài khoản'
    });
});

// POST: Đăng ký
router.post('/dangky', async (req, res) => {
    var salt = bcrypt.genSaltSync(10);
    var data = {
        HoVaTen: req.body.HoVaTen,
        Email: req.body.Email,
        HinhAnh: req.body.HinhAnh,
        TenDangNhap: req.body.TenDangNhap,
        MatKhau: bcrypt.hashSync(req.body.MatKhau, salt)
    };
    await TaiKhoan.create(data);
    req.session.success = 'Đã đăng ký tài khoản thành công.';
    res.redirect('/success');
});

// GET: Đăng nhập
router.get('/dangnhap', async (req, res) => {
    res.render('dangnhap', {
        title: 'Đăng nhập'
    });
});

// POST: Đăng nhập
router.post('/dangnhap', async (req, res) => {
    if(req.session.MaNguoiDung) {
        req.session.error = 'Người dùng đã đăng nhập rồi.';
        res.redirect('/error');
    } else {
        var taikhoan = await TaiKhoan.findOne({ TenDangNhap: req.body.TenDangNhap }).exec();
        if(taikhoan) {
            if(bcrypt.compareSync(req.body.MatKhau, taikhoan.MatKhau)) {
                if(taikhoan.KichHoat == 0) {
                    req.session.error = 'Người dùng đã bị khóa tài khoản.';
                    res.redirect('/error');
                } else {
                    // Đăng ký session
                    req.session.MaNguoiDung = taikhoan._id;
                    req.session.HoVaTen = taikhoan.HoVaTen;
                    req.session.QuyenHan = taikhoan.QuyenHan;
                    
                    res.redirect('/');
                }
            } else {
                req.session.error = 'Mật khẩu không đúng.';
                res.redirect('/error');
            }
        } else {
            req.session.error = 'Tên đăng nhập không tồn tại.';
            res.redirect('/error');
        }
    }
});

// ========================================================
// 2. ROUTER ĐỂ XỬ LÝ NÚT BẤM GOOGLE (CODE MỚI THÊM)
// ========================================================

// GET: Gọi API Google khi người dùng bấm nút
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET: Google trả dữ liệu về đây sau khi xác thực xong
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/dangnhap', session: false }),
  function(req, res) {
    // Nếu thành công, tự động gán Session y hệt đăng nhập truyền thống
    req.session.MaNguoiDung = req.user._id;
    req.session.HoVaTen = req.user.HoVaTen;
    req.session.QuyenHan = req.user.QuyenHan;
    
    // Gửi thông báo và chuyển về trang chủ
    req.session.success = 'Đăng nhập bằng Google thành công!';
    res.redirect('/');
  });
// ========================================================


// GET: Đăng xuất
router.get('/dangxuat', async (req, res) => {
    if(req.session.MaNguoiDung) {
        // Xóa session
        delete req.session.MaNguoiDung;
        delete req.session.HoVaTen;
        delete req.session.QuyenHan;
        
        res.redirect('/');
    } else {
        req.session.error = 'Người dùng chưa đăng nhập.';
        res.redirect('/error');
    }
});

// GET: Trang quản trị
router.get('/admin', async (req, res) => {
    res.render('admin', {
        title: 'Trang quản trị'
    });
});

module.exports = router;