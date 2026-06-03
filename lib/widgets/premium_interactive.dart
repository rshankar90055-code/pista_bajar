import 'package:flutter/material.dart';

/// Spring-tap scaling feedback wrapper widget
class AnimatedTapScale extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;

  const AnimatedTapScale({Key? key, required this.child, required this.onTap}) : super(key: key);

  @override
  State<AnimatedTapScale> createState() => _AnimatedTapScaleState();
}

class _AnimatedTapScaleState extends State<AnimatedTapScale> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 80),
      lowerBound: 0.95,
      upperBound: 1.0,
    )..value = 1.0;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.reverse(),
      onTapUp: (_) {
        _controller.forward();
        widget.onTap();
      },
      onTapCancel: () => _controller.forward(),
      child: ScaleTransition(
        scale: _controller,
        child: widget.child,
      ),
    );
  }
}

/// Shimmer Skeleton placeholder loader widget
class ShimmerLoading extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerLoading({
    Key? key,
    required this.width,
    required this.height,
    this.borderRadius = 12.0,
  }) : super(key: key);

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading> with SingleTickerProviderStateMixin {
  late AnimationController _shimmerController;
  late Animation<double> _shimmerAnimation;

  @override
  void initState() {
    super.initState();
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();

    _shimmerAnimation = Tween<double>(begin: -2.0, end: 2.0).animate(
      CurvedAnimation(parent: _shimmerController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Warm luxury organic chocolate/cream color bands
    final baseColor = isDark ? const Color(0xFF1E1E1E) : const Color(0xFFEFECE5);
    final highlightColor = isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF9F7F2);

    return AnimatedBuilder(
      animation: _shimmerAnimation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              colors: [
                baseColor,
                highlightColor,
                baseColor,
              ],
              stops: const [0.3, 0.5, 0.7],
              begin: Alignment(_shimmerAnimation.value - 1.0, -0.3),
              end: Alignment(_shimmerAnimation.value + 1.0, 0.3),
            ),
          ),
        );
      },
    );
  }
}

/// Custom Premium Error and Retry display panel
class RetryStateWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final bool isLoading;

  const RetryStateWidget({
    Key? key,
    required this.message,
    required this.onRetry,
    this.isLoading = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const goldColor = Color(0xFFD4A373);
    final isNetworkError = message.toLowerCase().contains("network");

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Elegant vector error badge icon
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A2616) : const Color(0xFFFAF7F2),
              shape: BoxShape.circle,
              border: Border.all(color: goldColor.withOpacity(0.3), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: goldColor.withOpacity(0.08),
                  blurRadius: 16,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Icon(
              isNetworkError ? Icons.wifi_off_rounded : Icons.cloud_off_rounded,
              color: goldColor,
              size: 44,
            ),
          ),
          const SizedBox(height: 24),
          
          // Translated friendly alert title
          Text(
            isNetworkError ? "Connection Interrupted" : "Service Temporarily Unavailable",
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
              color: isDark ? Colors.white : const Color(0xFF2C160B),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          
          // User-friendly error message description
          Text(
            message,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.white70 : Colors.black54,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          
          // Luxury Retry Action Button
          Container(
            constraints: const BoxConstraints(maxWidth: 200),
            child: ElevatedButton.icon(
              onPressed: isLoading ? null : onRetry,
              icon: isLoading
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh_rounded, size: 16),
              label: Text(
                isLoading ? "Reloading..." : "Retry Connection",
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 0.5),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3E2723),
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: goldColor, width: 1.2),
                ),
                elevation: 3,
                shadowColor: const Color(0xFF3E2723).withOpacity(0.3),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
