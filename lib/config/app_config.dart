class AppConfig {
  /// The merchant UPI ID used for GPay/PhonePe payments.
  /// Can be overridden at build time using:
  /// `--dart-define=UPI_ID=your_id@bank`
  static const String upiId = String.fromEnvironment(
    'UPI_ID',
    defaultValue: 'shubhachandra12pro@okicici',
  );

  /// The brand name of the merchant.
  static const String merchantName = 'Pista Bajar';
}
