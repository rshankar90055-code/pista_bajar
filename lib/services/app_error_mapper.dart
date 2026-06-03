import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AppErrorMapper {
  /// Converts any technical or network exception into a user-friendly message
  static String map(dynamic error) {
    if (error == null) {
      return "Something unexpected happened.\nPlease try again.";
    }

    final String errorStr = error.toString().toLowerCase();

    // 1. Development Logging
    debugPrint("=== [DEVELOPMENT LOGGING] AppErrorMapper.map ===");
    debugPrint("Error runtimeType: ${error.runtimeType}");
    debugPrint("Error string representation: $error");
    if (error is AuthException) {
      debugPrint("AuthException details: message='${error.message}', statusCode='${error.statusCode}'");
    } else if (error is PostgrestException) {
      debugPrint("PostgrestException details: message='${error.message}', code='${error.code}', details='${error.details}', hint='${error.hint}'");
    }
    debugPrint("=================================================");

    // 2. Supabase Configuration Errors (Invalid/expired API key or JWT signature failures)
    bool isConfigError = false;
    if (error is AuthException) {
      final msg = error.message.toLowerCase();
      if (msg.contains('invalid api key') ||
          msg.contains('invalid_api_key') ||
          msg.contains('bad jwt') ||
          msg.contains('jwt expired') ||
          msg.contains('invalid jwt') ||
          msg.contains('jwt') ||
          msg.contains('jws') ||
          error.statusCode == '400') {
        isConfigError = true;
      }
    } else if (error is PostgrestException) {
      final msg = error.message.toLowerCase();
      if (msg.contains('invalid api key') ||
          msg.contains('jwt') ||
          msg.contains('jws') ||
          error.code == '401' ||
          error.code == '400') {
        isConfigError = true;
      }
    } else {
      if (errorStr.contains('invalid_api_key') ||
          errorStr.contains('invalid api key') ||
          errorStr.contains('bad jwt') ||
          errorStr.contains('invalid jwt') ||
          errorStr.contains('jwt expired') ||
          errorStr.contains('jwserror') ||
          errorStr.contains('jws')) {
        isConfigError = true;
      }
    }

    if (isConfigError) {
      return "System configuration error.\nPlease contact support or try again later.";
    }

    // 3. Backend Unavailable / Server Errors (e.g. 500, 502, 503, 504)
    bool isBackendUnavailable = false;
    if (error is AuthException) {
      final msg = error.message.toLowerCase();
      final status = error.statusCode;
      if (status == '500' || status == '502' || status == '503' || status == '504' ||
          msg.contains('service unavailable') ||
          msg.contains('bad gateway') ||
          msg.contains('gateway timeout') ||
          msg.contains('server error') ||
          msg.contains('internal server error')) {
        isBackendUnavailable = true;
      }
    } else if (error is PostgrestException) {
      final msg = error.message.toLowerCase();
      final code = error.code;
      if (code == '500' || code == '502' || code == '503' || code == '504' ||
          msg.contains('service unavailable') ||
          msg.contains('bad gateway') ||
          msg.contains('gateway timeout') ||
          msg.contains('server error') ||
          msg.contains('internal server error')) {
        isBackendUnavailable = true;
      }
    } else {
      if (errorStr.contains('500') ||
          errorStr.contains('502') ||
          errorStr.contains('503') ||
          errorStr.contains('504') ||
          errorStr.contains('service unavailable') ||
          errorStr.contains('bad gateway') ||
          errorStr.contains('gateway timeout') ||
          errorStr.contains('server error') ||
          errorStr.contains('internal server error') ||
          errorStr.contains('database error')) {
        isBackendUnavailable = true;
      }
    }

    if (isBackendUnavailable) {
      return "Server is temporarily unavailable.\nPlease try again in a few minutes.";
    }

    // 4. Invalid Credentials
    bool isInvalidCredentials = false;
    if (error is AuthException) {
      final msg = error.message.toLowerCase();
      if (msg.contains('invalid login credentials') ||
          msg.contains('invalid_credentials') ||
          msg.contains('invalid credentials') ||
          msg.contains('invalid email or password') ||
          msg.contains('wrong password') ||
          msg.contains('incorrect password') ||
          msg.contains('incorrect email')) {
        isInvalidCredentials = true;
      }
    } else {
      if (errorStr.contains('invalid_login_credentials') ||
          errorStr.contains('invalid_credentials') ||
          errorStr.contains('invalid credentials') ||
          errorStr.contains('invalid email or password') ||
          errorStr.contains('wrong password') ||
          errorStr.contains('incorrect email') ||
          errorStr.contains('incorrect password')) {
        isInvalidCredentials = true;
      }
    }

    if (isInvalidCredentials) {
      return "Incorrect email or password.";
    }

    // 5. User Already Exists
    bool isUserExists = false;
    if (error is AuthException) {
      final msg = error.message.toLowerCase();
      if (msg.contains('user already exists') ||
          msg.contains('already registered') ||
          msg.contains('already exists') ||
          msg.contains('email already in use')) {
        isUserExists = true;
      }
    } else if (error is PostgrestException) {
      final msg = error.message.toLowerCase();
      if (error.code == '23505' ||
          msg.contains('duplicate key value') ||
          msg.contains('unique constraint') ||
          msg.contains('already exists')) {
        isUserExists = true;
      }
    } else {
      if (errorStr.contains('user already exists') ||
          errorStr.contains('already registered') ||
          errorStr.contains('already exists') ||
          errorStr.contains('duplicate account') ||
          errorStr.contains('email already in use')) {
        isUserExists = true;
      }
    }

    if (isUserExists) {
      return "An account already exists with this email.";
    }

    // 6. Email Not Verified
    bool isEmailNotVerified = false;
    if (error is AuthException) {
      final msg = error.message.toLowerCase();
      if (msg.contains('email not confirmed') ||
          msg.contains('confirm your email') ||
          msg.contains('email not verified') ||
          msg.contains('verify your email')) {
        isEmailNotVerified = true;
      }
    } else {
      if (errorStr.contains('email not confirmed') ||
          errorStr.contains('confirm your email') ||
          errorStr.contains('email not verified') ||
          errorStr.contains('verify your email')) {
        isEmailNotVerified = true;
      }
    }

    if (isEmailNotVerified) {
      return "Please verify your email before signing in.";
    }

    // 7. Network and Connection Exceptions
    bool isNetworkError = false;
    if (error is SocketException) {
      isNetworkError = true;
    } else {
      // Look for explicit network error indicators
      if (errorStr.contains('socketexception') ||
          errorStr.contains('handshake failed') ||
          errorStr.contains('connection failed') ||
          errorStr.contains('connection refused') ||
          errorStr.contains('failed host lookup') ||
          errorStr.contains('network unreachable') ||
          errorStr.contains('errno = 13') ||
          errorStr.contains('permission denied') ||
          errorStr.contains('timed out') ||
          errorStr.contains('timeout') ||
          (errorStr.contains('clientexception') && 
              (errorStr.contains('connection') || 
               errorStr.contains('socket') || 
               errorStr.contains('host')))) {
        isNetworkError = true;
      }
    }

    if (isNetworkError) {
      return "No internet connection.\nPlease check your network and try again.";
    }

    // Default Fallback
    return "Something went wrong.\nPlease try again shortly.";
  }
}
