import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/offer.dart';
import '../widgets/premium_interactive.dart';

class OffersScreen extends StatefulWidget {
  final VoidCallback onBack;

  const OffersScreen({Key? key, required this.onBack}) : super(key: key);

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  String? _copiedCode;

  void _copyToClipboard(String code) {
    Clipboard.setData(ClipboardData(text: code));
    setState(() {
      _copiedCode = code;
    });
    
    // Clear copy confirmation label after 2 seconds
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _copiedCode = null;
        });
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Coupon '$code' copied to clipboard successfully!"),
        backgroundColor: const Color(0xFF386B39),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const goldColor = Color(0xFFD4A373);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'EXCLUSIVE PROMOTIONS',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: widget.onBack,
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => appState.refreshCatalog(),
          color: goldColor,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Luxury Gold Banner Panel
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2C160B), Color(0xFF5D2D16)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: goldColor.withOpacity(0.3), width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF3E2723).withOpacity(0.16),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "👑 FESTIVE NUTS EXTRAVAGANZA",
                        style: TextStyle(
                          color: goldColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        "Unlock Up To 50% Off On Premium Selections",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Elevate your family celebrations with handpicked standard almonds, cashews, and fresh Kashmir Kesar. Nitrogen-locked freshness guaranteed.",
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 11,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 28),
                
                // 2. Section Title
                const Text(
                  "ACTIVE PROMO CODES",
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: goldColor,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 12),

                // 3. Dynamic Coupons Grid/List
                if (appState.isLoading)
                  ...List.generate(3, (index) => _buildShimmerCouponCard())
                else if (appState.offers.isEmpty)
                  _buildEmptyState()
                else
                  ...appState.offers.map((offer) => _buildCouponCard(offer, isDark, goldColor)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCouponCard(Offer offer, bool isDark, Color goldColor) {
    final isCopied = _copiedCode == offer.code;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161616) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isCopied ? const Color(0xFF386B39) : const Color(0xFFE8D9C5),
          width: isCopied ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3E2723).withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Coupon Tag Discount Code Box
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isCopied 
                      ? const Color(0xFF386B39).withOpacity(0.12)
                      : goldColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isCopied ? const Color(0xFF386B39) : goldColor.withOpacity(0.4),
                    width: 1,
                  ),
                ),
                child: Text(
                  offer.code.toUpperCase(),
                  style: TextStyle(
                    color: isCopied ? const Color(0xFF81C784) : goldColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              
              // Copy Trigger
              GestureDetector(
                onTap: () => _copyToClipboard(offer.code),
                child: Row(
                  children: [
                    Icon(
                      isCopied ? Icons.check_circle_rounded : Icons.copy_all_rounded,
                      color: isCopied ? const Color(0xFF81C784) : goldColor,
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isCopied ? "Copied" : "Copy Code",
                      style: TextStyle(
                        color: isCopied ? const Color(0xFF81C784) : goldColor,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 14),
          
          // Coupon Title
          Text(
            offer.title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 6),
          
          // Coupon Details
          Text(
            offer.description,
            style: TextStyle(
              color: Theme.of(context).hintColor,
              fontSize: 11,
              height: 1.4,
            ),
          ),
          
          const SizedBox(height: 12),
          const Divider(color: Color(0xFFE8D9C5), height: 1, thickness: 0.5),
          const SizedBox(height: 10),
          
          // Minimum Order requirements
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('🛒', style: TextStyle(fontSize: 12)),
                  const SizedBox(width: 6),
                  Text(
                    "Min Order: ₹${offer.minimumOrder}",
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                ],
              ),
              Row(
                children: [
                  const Text('⏰', style: TextStyle(fontSize: 12)),
                  const SizedBox(width: 6),
                  const Text(
                    "Active promotion",
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerCouponCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      height: 148,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
      ),
      child: const ShimmerLoading(
        width: double.infinity,
        height: double.infinity,
        borderRadius: 14,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: [
            const Text("🏷️", style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            const Text(
              "No Active Coupons",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              "We will roll out standard launch deals shortly! Check back soon.",
              style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
