import 'package:flutter/material.dart';
import 'premium_interactive.dart';

class LuxuryLoading {
  /// Renders a highly premium, non-dismissible circular loading dialog
  static void show(BuildContext context, {String message = "Processing securely..."}) {
    const goldColor = Color(0xFFD4A373);
    
    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black.withOpacity(0.56),
      builder: (ctx) {
        return WillPopScope(
          onWillPop: () async => false, // Prevent back-button dismiss
          child: Center(
            child: Material(
              color: Colors.transparent,
              child: Container(
                padding: const EdgeInsets.all(28),
                margin: const EdgeInsets.symmetric(horizontal: 40),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: goldColor.withOpacity(0.35), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.18),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(
                      width: 44,
                      height: 44,
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(goldColor),
                        strokeWidth: 3.5,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      message,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF2C160B),
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  /// Dismisses any active blocking loading dialog
  static void dismiss(BuildContext context) {
    if (Navigator.canPop(context)) {
      Navigator.of(context).pop();
    }
  }
}

/// A grid of product card skeletons
class ProductSkeletonGrid extends StatelessWidget {
  final int count;
  const ProductSkeletonGrid({Key? key, this.count = 6}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.68,
      ),
      itemCount: count,
      itemBuilder: (context, index) {
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image placeholder
              const ShimmerLoading(
                width: double.infinity,
                height: 110,
                borderRadius: 20,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(10.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const ShimmerLoading(width: 80, height: 12),
                      const SizedBox(height: 6),
                      const ShimmerLoading(width: 120, height: 10),
                      const SizedBox(height: 4),
                      const ShimmerLoading(width: 100, height: 10),
                      const Spacer(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          ShimmerLoading(width: 50, height: 14),
                          ShimmerLoading(width: 28, height: 28, borderRadius: 8),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// A list of order card skeletons
class OrderSkeletonList extends StatelessWidget {
  final int count;
  const OrderSkeletonList({Key? key, this.count = 3}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: count,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          height: 160,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  ShimmerLoading(width: 100, height: 14),
                  ShimmerLoading(width: 70, height: 18, borderRadius: 8),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const ShimmerLoading(width: 44, height: 44, borderRadius: 10),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        ShimmerLoading(width: 120, height: 12),
                        const SizedBox(height: 6),
                        ShimmerLoading(width: 80, height: 10),
                      ],
                    ),
                  ),
                  const ShimmerLoading(width: 40, height: 12),
                ],
              ),
              const Spacer(),
              const Divider(color: Color(0xFFE8D9C5), height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  ShimmerLoading(width: 120, height: 12),
                  ShimmerLoading(width: 80, height: 12),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
