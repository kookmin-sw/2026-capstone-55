/**
 * Passport 소셜 로그인 전략 설정
 * 구글 / 카카오 / 네이버
 */

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver-v2').Strategy;

module.exports = function(passport) {
  // BASE_URL은 OAuth 콜백에서 동적으로 결정 (로컬이면 localhost, ngrok이면 ngrok)
  // passport 전략에서는 callbackURL을 상대 경로로 설정하고,
  // 카카오/네이버는 라우트에서 요청 호스트 기반으로 동적 생성

  function getBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${proto}://${host}`;
  }

  const base = process.env.BASE_URL || '';

  // --- 구글 (로그인용) ---
  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('여기에')) {
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      proxy: true
    }, (accessToken, refreshToken, profile, done) => {
      const user = {
        provider: 'google',
        providerId: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        profileImage: profile.photos?.[0]?.value || ''
      };
      return done(null, user);
    }));

    // 구글 (회원가입용 - 콜백 URL 다름)
    passport.use('google-register', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/register/callback',
      proxy: true
    }, (accessToken, refreshToken, profile, done) => {
      const user = {
        provider: 'google',
        providerId: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        profileImage: profile.photos?.[0]?.value || ''
      };
      return done(null, user);
    }));
  }

  // --- 카카오 (로그인용) ---
  if (process.env.KAKAO_CLIENT_ID && !process.env.KAKAO_CLIENT_ID.includes('여기에')) {
    passport.use('kakao', new KakaoStrategy({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      callbackURL: '/auth/kakao/callback'
    }, (accessToken, refreshToken, profile, done) => {
      console.log('[카카오 로그인] profile:', JSON.stringify(profile, null, 2));
      const kakaoAccount = profile._json?.kakao_account || {};
      const properties = profile._json?.properties || {};
      const user = {
        provider: 'kakao',
        providerId: profile.id.toString(),
        email: kakaoAccount.email || '',
        name: properties.nickname || profile.displayName || profile.username || '카카오 사용자',
        profileImage: properties.profile_image || kakaoAccount.profile?.profile_image_url || ''
      };
      return done(null, user);
    }));

    // 카카오 (회원가입용 - 콜백 URL 다름)
    passport.use('kakao-register', new KakaoStrategy({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      callbackURL: '/auth/kakao/register/callback'
    }, (accessToken, refreshToken, profile, done) => {
      const kakaoAccount = profile._json?.kakao_account || {};
      const properties = profile._json?.properties || {};
      const user = {
        provider: 'kakao',
        providerId: profile.id.toString(),
        email: kakaoAccount.email || '',
        name: properties.nickname || profile.displayName || profile.username || '카카오 사용자',
        profileImage: properties.profile_image || kakaoAccount.profile?.profile_image_url || ''
      };
      return done(null, user);
    }));
  }

  // --- 네이버 (로그인용) ---
  if (process.env.NAVER_CLIENT_ID && !process.env.NAVER_CLIENT_ID.includes('여기에')) {
    passport.use('naver', new NaverStrategy({
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: '/auth/naver/callback'
    }, (accessToken, refreshToken, profile, done) => {
      const user = {
        provider: 'naver',
        providerId: profile.id,
        email: profile.email || '',
        name: profile.name || profile.nickname || '',
        profileImage: profile.profileImage || ''
      };
      return done(null, user);
    }));

    // 네이버 (회원가입용 - 콜백 URL 다름)
    passport.use('naver-register', new NaverStrategy({
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: '/auth/naver/register/callback'
    }, (accessToken, refreshToken, profile, done) => {
      const user = {
        provider: 'naver',
        providerId: profile.id,
        email: profile.email || '',
        name: profile.name || profile.nickname || '',
        profileImage: profile.profileImage || ''
      };
      return done(null, user);
    }));
  }
};
