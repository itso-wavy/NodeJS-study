const { User } = require('../models/User');

let auth = (req, res, next) => {
  // 인증 처리 하는 곳

  // 클라이언트 쿠키에서 토큰을 가져옴
  let token = req.cookies.x_auth;

  // 토큰 복호화 후 유저 탐색
  User.findByToken(token, (err, user) => {
    if (err) throw err;
    if (!user) return res.json({ isAuth: false, error: true });

    req.token = token;
    req.user = user;
    next(); // middleware 다음으로 이동
  });

  // 유저가 있으면 인증 성공
  // 유저가 없으면 인증 실패
};

module.exports = { auth };
