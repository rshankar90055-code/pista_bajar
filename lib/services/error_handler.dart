import 'app_error_mapper.dart';

class ErrorHandler {
  /// Map raw exceptions into elegant customer-friendly messages using AppErrorMapper
  static String map(dynamic error) {
    return AppErrorMapper.map(error);
  }
}
