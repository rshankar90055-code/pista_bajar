import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/app_state.dart';
import '../models/order.dart';
import '../models/address.dart';
import '../services/error_handler.dart';
import '../widgets/premium_feedback.dart';
import '../widgets/luxury_loading.dart';
import '../config/app_config.dart';

class CheckoutScreen extends StatefulWidget {
  final VoidCallback onBack;
  final Function(Order) onOrderConfirmed;

  const CheckoutScreen({
    Key? key,
    required this.onBack,
    required this.onOrderConfirmed,
  }) : super(key: key);

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String? _errorMessage;

  void _handleConfirmPayment(BuildContext context) async {
    final appState = context.read<AppState>();
    
    // Fallback to active address
    if (appState.addresses.isEmpty) {
      setState(() {
        _errorMessage = "Delivery Address is missing. Please add an address.";
      });
      PremiumFeedback.showError(context, "Delivery Address is missing. Please add an address.");
      return;
    }

    final activeAddress = appState.addresses.firstWhere((a) => a.isDefault, orElse: () => appState.addresses.first);

    setState(() {
      _errorMessage = null;
    });

    if (appState.paymentMethod == "upi" && !appState.isDirectQrPayment) {
      // 1. UPI Intent Deep Linking (GPay/PhonePe)
      final String appName = appState.upiApp == "gpay" ? "Google Pay" : "PhonePe";
      final String amount = appState.totalAmount.toString();
      final TargetPlatform platform = Theme.of(context).platform;

      // Construct direct custom scheme URIs
      String directUrl = '';
      if (appState.upiApp == "gpay") {
        if (platform == TargetPlatform.android) {
          directUrl = 'tez://upi/pay?pa=${AppConfig.upiId}&pn=${Uri.encodeComponent(AppConfig.merchantName)}&am=$amount&cu=INR';
        } else {
          directUrl = 'gpay://upi/pay?pa=${AppConfig.upiId}&pn=${Uri.encodeComponent(AppConfig.merchantName)}&am=$amount&cu=INR';
        }
      } else {
        directUrl = 'phonepe://pay?pa=${AppConfig.upiId}&pn=${Uri.encodeComponent(AppConfig.merchantName)}&am=$amount&cu=INR';
      }

      Uri primaryUri = Uri.parse(directUrl);
      bool canLaunch = await canLaunchUrl(primaryUri);

      // Attempt fallback check just in case
      if (!canLaunch) {
        String alternativeUrl = '';
        if (appState.upiApp == "gpay") {
          alternativeUrl = platform == TargetPlatform.android
              ? 'gpay://upi/pay?pa=${AppConfig.upiId}&pn=${Uri.encodeComponent(AppConfig.merchantName)}&am=$amount&cu=INR'
              : 'tez://upi/pay?pa=${AppConfig.upiId}&pn=${Uri.encodeComponent(AppConfig.merchantName)}&am=$amount&cu=INR';
        } else {
          alternativeUrl = 'phonepe://upi/pay?pa=${AppConfig.upiId}&pn=${Uri.encodeComponent(AppConfig.merchantName)}&am=$amount&cu=INR';
        }
        
        final Uri altUri = Uri.parse(alternativeUrl);
        if (await canLaunchUrl(altUri)) {
          primaryUri = altUri;
          canLaunch = true;
        }
      }

      // If the app is not installed, show a helpful message and do not launch
      if (!canLaunch) {
        if (mounted) {
          PremiumFeedback.showError(
            context,
            "$appName is not installed on your device. Please install it or choose another payment method.",
          );
        }
        return;
      }

      // Show luxury pending transition bottom sheet
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (ctx) {
          const goldColor = Color(0xFFD4A373);
          return Container(
            decoration: BoxDecoration(
              color: Theme.of(ctx).scaffoldBackgroundColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
              border: Border.all(color: const Color(0xFFE8D9C5), width: 1.5),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: goldColor.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: CircularProgressIndicator(color: goldColor, strokeWidth: 3),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  "Redirecting to $appName...",
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 8),
                Text(
                  "Opening $appName secure gateway to pay ₹$amount to ${AppConfig.upiId}.",
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    _executePlaceOrder(activeAddress);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3E2723),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("I have completed the payment", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text("Cancel Payment", style: TextStyle(color: Colors.grey, fontSize: 11)),
                ),
              ],
            ),
          );
        },
      );

      // Attempt to launch the deep link
      try {
        await launchUrl(primaryUri, mode: LaunchMode.externalApplication);
      } catch (e) {
        debugPrint("Error launching UPI intent: $e");
      }
    } else {
      // 2. Direct Qr Payment or Cash on Delivery
      _executePlaceOrder(activeAddress);
    }
  }

  void _executePlaceOrder(SavedAddress activeAddress) async {
    final appState = context.read<AppState>();
    setState(() {
      _errorMessage = null;
    });

    LuxuryLoading.show(context, message: "Processing your premium order...");

    try {
      final order = await appState.placeOrder(activeAddress);
      if (mounted) {
        LuxuryLoading.dismiss(context);
      }
      if (order != null) {
        widget.onOrderConfirmed(order);
      } else {
        throw Exception("Failed to place order. Please review your details.");
      }
    } catch (e) {
      if (mounted) {
        LuxuryLoading.dismiss(context);
      }
      final prettyError = ErrorHandler.map(e);
      setState(() {
        _errorMessage = prettyError;
      });
      if (mounted) {
        PremiumFeedback.showErrorDialog(
          context,
          title: "Checkout Interrupted",
          message: prettyError,
          onRetry: () => _executePlaceOrder(activeAddress),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Branded Checkout Gateway', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: widget.onBack,
        ),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 140),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_errorMessage != null) ...[
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7B2D26).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFD4A373).withOpacity(0.3), width: 1.2),
                  ),
                  child: Row(
                    children: [
                      const Text("⚠️", style: TextStyle(fontSize: 16)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(
                            color: Color(0xFFE57373),
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // Payment Grid Selector heading
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Text(
                'Select Branded Payment Method',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),

            // Branded options
            Column(
              children: [
                // 1. Google Pay
                _buildPaymentMethodTile(
                  context: context,
                  method: "upi",
                  app: "gpay",
                  isDirectQr: false,
                  title: "Google Pay",
                  subtitle: "Pay instantly via secure GPay deep link",
                  icon: Icons.account_balance_wallet_rounded,
                  brandColor: const Color(0xFFEA4335),
                  pillLabel: "Instant",
                ),

                // 2. PhonePe
                _buildPaymentMethodTile(
                  context: context,
                  method: "upi",
                  app: "phonepe",
                  isDirectQr: false,
                  title: "PhonePe",
                  subtitle: "Redirect and pay directly using PhonePe",
                  icon: Icons.account_balance_wallet_rounded,
                  brandColor: const Color(0xFF5F259F),
                  pillLabel: "Instant",
                ),

                // 3. UPI Direct Scan QR
                _buildPaymentMethodTile(
                  context: context,
                  method: "upi",
                  app: "gpay",
                  isDirectQr: true,
                  title: "UPI Direct Scan & Pay QR",
                  subtitle: "Scan QR or upload payment verification proof",
                  icon: Icons.qr_code_scanner_rounded,
                  brandColor: const Color(0xFFD4A373),
                  pillLabel: "QR Code",
                ),

                // Active Direct QR Scanner container
                if (appState.paymentMethod == "upi" && appState.isDirectQrPayment)
                  _buildDirectQrContainer(context),

                // 4. Cash on Delivery (COD)
                _buildPaymentMethodTile(
                  context: context,
                  method: "cash_on_delivery",
                  app: "gpay",
                  isDirectQr: false,
                  title: "Cash on Delivery",
                  subtitle: "Pay cash at your door. ₹9 Handling Charge applies",
                  icon: Icons.payments_rounded,
                  brandColor: const Color(0xFF10B981),
                  pillLabel: "₹9 handling fee",
                  showWarning: true,
                ),
              ],
            ),
          ],
        ),
      ),
      // Sticky pricing calculations & payment CTA
      bottomSheet: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            border: Border(top: BorderSide(color: const Color(0xFFD4A373).withOpacity(0.24), width: 1.2)),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 16, offset: const Offset(0, -6)),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Subtotal Items', style: TextStyle(fontSize: 12)),
                  Text('₹${appState.subtotal}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 6),
              if (appState.discountAmount > 0) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Coupon Discount', style: TextStyle(fontSize: 12, color: Colors.green)),
                    Text('-₹${appState.discountAmount}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green)),
                  ],
                ),
                const SizedBox(height: 6),
              ],
              if (appState.giftWrapFee > 0) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Festive Gift Wrap Fee', style: TextStyle(fontSize: 12)),
                    Text('₹${appState.giftWrapFee}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 6),
              ],
              if (appState.paymentMethod == "cash_on_delivery") ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('COD Cash Handling Charge', style: TextStyle(fontSize: 12, color: Color(0xFF7B2D26))),
                    Text('+₹9', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF7B2D26))),
                  ],
                ),
                const SizedBox(height: 6),
              ],
              if (appState.discountAmount > 0) ...[
                const SizedBox(height: 4),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.withOpacity(0.2)),
                  ),
                  child: Center(
                    child: Text(
                      '🎉 You Saved ₹${appState.discountAmount} on this order!',
                      style: const TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
              ],
              const Divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Grand Total Payable', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  Text(
                    '₹${appState.totalAmount}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFFD4A373)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: appState.isLoading ? null : () => _handleConfirmPayment(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3E2723),
                  foregroundColor: const Color(0xFFFAF7F2),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFD4A373), width: 1.5),
                  ),
                ),
                child: appState.isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('SECURELY PLACE ORDER', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentMethodTile({
    required BuildContext context,
    required String method,
    required String app,
    required bool isDirectQr,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color brandColor,
    required String pillLabel,
    bool showWarning = false,
  }) {
    final appState = context.read<AppState>();
    final isSel = (appState.paymentMethod == method &&
        (method != "upi" ||
            (appState.upiApp == app && appState.isDirectQrPayment == isDirectQr)));

    final goldColor = const Color(0xFFD4A373);

    return GestureDetector(
      onTap: () {
        appState.setPaymentMethod(method);
        if (method == "upi") {
          appState.setUpiApp(app);
          appState.setDirectQrPayment(isDirectQr);
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSel ? goldColor : const Color(0xFFE8D9C5),
            width: isSel ? 2 : 1,
          ),
          boxShadow: [
            if (isSel)
              BoxShadow(
                color: goldColor.withOpacity(0.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: brandColor.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(icon, color: brandColor, size: 18),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                  if (showWarning && isSel) ...[
                    const SizedBox(height: 4),
                    const Text(
                      '⚠️ ₹9 Cash Handling surcharge added to grand total.',
                      style: TextStyle(color: Color(0xFF7B2D26), fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: goldColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                pillLabel,
                style: TextStyle(color: goldColor, fontSize: 9, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDirectQrContainer(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final goldColor = const Color(0xFFD4A373);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFFDFDFD),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: goldColor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Text(
            'UPI Direct Scan QR Code',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          const SizedBox(height: 12),
          // QR Image Stub representing our scanning receipt
          Container(
            width: 130,
            height: 130,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: const Center(
              child: Icon(Icons.qr_code_2_rounded, size: 90, color: Colors.black),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Scan using any UPI App (GPay, PhonePe, Paytm, BHIM) and upload your payment verification screenshot below:',
            style: TextStyle(fontSize: 10, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          // Screenshot receipt uploader button stub
          OutlinedButton.icon(
            onPressed: () {
              // Simulate uploading base64 screenshot
              context.read<AppState>().setUpiScreenshot("data:image/png;base64,receipt_mock_base64");
            },
            icon: const Icon(Icons.upload_file_rounded, size: 16),
            label: Text(
              context.watch<AppState>().upiScreenshot != null ? "Receipt Uploaded! ✅" : "Upload Verification Receipt",
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
            ),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: goldColor),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }
}
