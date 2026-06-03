import 'dart:async';
import 'package:flutter/material.dart';

class PremiumFeedback {
  /// Renders an elegant forest-green and gold-accented custom toast at the top of screen
  static void showSuccess(BuildContext context, String message) {
    final overlayState = Overlay.of(context);
    late OverlayEntry overlayEntry;

    overlayEntry = OverlayEntry(
      builder: (context) => _PremiumToastWidget(
        message: message,
        isError: false,
        onDismiss: () {
          overlayEntry.remove();
        },
      ),
    );

    overlayState.insert(overlayEntry);
  }

  /// Renders a warm organic crimson and gold-accented custom error toast at the top of screen
  static void showError(BuildContext context, String message) {
    final overlayState = Overlay.of(context);
    late OverlayEntry overlayEntry;

    overlayEntry = OverlayEntry(
      builder: (context) => _PremiumToastWidget(
        message: message,
        isError: true,
        onDismiss: () {
          overlayEntry.remove();
        },
      ),
    );

    overlayState.insert(overlayEntry);
  }

  /// Renders an outstanding dark luxury gold-trimmed alert modal dialog with stubs for retry mechanisms
  static void showErrorDialog(
    BuildContext context, {
    required String title,
    required String message,
    VoidCallback? onRetry,
  }) {
    const goldColor = Color(0xFFD4A373);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) {
        return Center(
          child: Material(
            color: Colors.transparent,
            child: ScaleTransition(
              scale: CurvedAnimation(
                parent: ModalRoute.of(ctx)!.animation!,
                curve: Curves.easeOutBack,
              ),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 360),
                margin: const EdgeInsets.all(24),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF161616) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: goldColor.withOpacity(0.4), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.4),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Warning icon badge
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7B2D26).withOpacity(0.12),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE57373).withOpacity(0.3), width: 1),
                      ),
                      child: const Icon(
                        Icons.warning_amber_rounded,
                        color: Color(0xFFE57373),
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 18),
                    
                    // Alert Title
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                        color: isDark ? Colors.white : const Color(0xFF2C160B),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 10),
                    
                    // Alert message body
                    Text(
                      message,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.white70 : Colors.black87,
                        height: 1.4,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    
                    // Actions row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        if (onRetry != null) ...[
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                Navigator.of(ctx).pop();
                              },
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: isDark ? Colors.white30 : Colors.black26, width: 1),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              child: Text(
                                "Close",
                                style: TextStyle(
                                  color: isDark ? Colors.white70 : Colors.black54, 
                                  fontWeight: FontWeight.bold, 
                                  fontSize: 12
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.of(ctx).pop();
                                onRetry();
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF3E2723),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: const BorderSide(color: goldColor, width: 1),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                elevation: 2,
                              ),
                              child: const Text(
                                "Try Again",
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ),
                          ),
                        ] else ...[
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => Navigator.of(ctx).pop(),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF3E2723),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: const BorderSide(color: goldColor, width: 1),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                elevation: 2,
                              ),
                              child: const Text(
                                "Acknowledge",
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ),
                          ),
                        ]
                      ],
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
}

class _PremiumToastWidget extends StatefulWidget {
  final String message;
  final bool isError;
  final VoidCallback onDismiss;

  const _PremiumToastWidget({
    Key? key,
    required this.message,
    required this.isError,
    required this.onDismiss,
  }) : super(key: key);

  @override
  State<_PremiumToastWidget> createState() => _PremiumToastWidgetState();
}

class _PremiumToastWidgetState extends State<_PremiumToastWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0, -1.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.elasticOut,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    ));

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.elasticOut,
    ));

    _controller.forward();

    _timer = Timer(const Duration(seconds: 3, milliseconds: 200), () {
      _dismiss();
    });
  }

  void _dismiss() {
    if (mounted) {
      _controller.reverse().then((_) {
        widget.onDismiss();
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const goldColor = Color(0xFFD4A373);
    const crimsonColor = Color(0xFFE57373);

    return SafeArea(
      child: Align(
        alignment: Alignment.topCenter,
        child: Padding(
          padding: const EdgeInsets.only(top: 24.0, left: 16.0, right: 16.0),
          child: SlideTransition(
            position: _offsetAnimation,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Material(
                  color: Colors.transparent,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: widget.isError
                            ? (isDark
                                ? [const Color(0xFF3B1E1E), const Color(0xFF4C2A2A)]
                                : [const Color(0xFFFDF8F8), const Color(0xFFF6E8E8)])
                            : (isDark
                                ? [const Color(0xFF0F240C), const Color(0xFF1E351A)]
                                : [const Color(0xFFFAF7F2), const Color(0xFFEFE9DB)]),
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: widget.isError ? crimsonColor : goldColor,
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (widget.isError ? crimsonColor : goldColor).withOpacity(0.24),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                          spreadRadius: 2,
                        ),
                        BoxShadow(
                          color: Colors.black.withOpacity(0.12),
                          blurRadius: 6,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Icon badge
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: (widget.isError ? const Color(0xFF7B2D26) : goldColor).withOpacity(0.16),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            widget.isError ? "⚠️" : "✨",
                            style: const TextStyle(fontSize: 15),
                          ),
                        ),
                        const SizedBox(width: 12),
                        
                        // Text Label
                        Flexible(
                          child: Text(
                            widget.message,
                            style: TextStyle(
                              color: widget.isError
                                  ? (isDark ? const Color(0xFFFCE4E4) : const Color(0xFF5C2D2D))
                                  : (isDark ? const Color(0xFFFAF7F2) : const Color(0xFF3E2723)),
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
