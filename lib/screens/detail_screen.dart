import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../providers/app_state.dart';

class DetailScreen extends StatefulWidget {
  final Product product;
  final VoidCallback onBack;
  final VoidCallback onBuyNow;

  const DetailScreen({
    Key? key,
    required this.product,
    required this.onBack,
    required this.onBuyNow,
  }) : super(key: key);

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> with SingleTickerProviderStateMixin {
  String _selectedWeight = "1kg"; // Default to '1kg' weight tier selection

  late AnimationController _bounceController;
  late Animation<double> _bounceAnimation;

  final List<Map<String, String>> _sizesMeta = [
    {"label": "250g Festive Sachet", "value": "250g", "icon": "🌸"},
    {"label": "500g Royal Bowl", "value": "500g", "icon": "🌰"},
    {"label": "1kg Standard Pack", "value": "1kg", "icon": "👑"},
  ];

  @override
  void initState() {
    super.initState();
    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _bounceAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween<double>(begin: 1.0, end: 1.25), weight: 50),
      TweenSequenceItem(tween: Tween<double>(begin: 1.25, end: 1.0), weight: 50),
    ]).animate(_bounceController);
  }

  @override
  void dispose() {
    _bounceController.dispose();
    super.dispose();
  }

  void _triggerAddToCart(BuildContext context) {
    final appState = context.read<AppState>();
    appState.updateCart(widget.product.id, _selectedWeight, 1);
    
    _bounceController.forward(from: 0.0);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Text('✨', style: TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Added $_selectedWeight of ${widget.product.name} to your Cart!',
                style: const TextStyle(
                  color: Color(0xFF3E2723),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFFFAF7F2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFD4A373), width: 1.5),
        ),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final appState = context.watch<AppState>();
    final isWishlisted = appState.wishlist.contains(widget.product.id);
    final calculatedPrice = widget.product.getPriceForWeight(_selectedWeight);
    const goldColor = Color(0xFFD4A373);

    return Scaffold(
      body: SafeArea(
        top: false,
        bottom: false,
        child: Stack(
          children: [
            // Scrollable detailed information
            Positioned.fill(
              child: SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: 110),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product image banner with back & wishlist actions
                    Stack(
                      children: [
                        Hero(
                          tag: 'product_image_${widget.product.id}',
                          child: Image.network(
                            widget.product.imageUrl,
                            height: 280,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        // Soft elegant shadow overlay on image
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Colors.black.withOpacity(0.4), Colors.transparent],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                        ),
                        // Back Button
                        Positioned(
                          left: 16,
                          top: 48,
                          child: GestureDetector(
                            onTap: widget.onBack,
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.5),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white.withOpacity(0.2)),
                              ),
                              child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 16),
                            ),
                          ),
                        ),
                        // Red Wishlist Heart Icon Toggle
                        Positioned(
                          right: 16,
                          top: 48,
                          child: GestureDetector(
                            onTap: () => appState.toggleWishlist(widget.product.id),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.5),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white.withOpacity(0.2)),
                              ),
                              child: Center(
                                child: Icon(
                                  isWishlisted ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                  color: isWishlisted ? Colors.redAccent : Colors.white,
                                  size: 20,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Delivery Clock pill
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF386B39).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFF386B39).withOpacity(0.24)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(Icons.flash_on_rounded, color: Color(0xFF386B39), size: 14),
                                SizedBox(width: 4),
                                Text(
                                  'Express Delivery: Arriving in 15 Mins',
                                  style: TextStyle(
                                    color: Color(0xFF386B39),
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),

                          // 2. Title & category
                          Text(
                            widget.product.name,
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, height: 1.2),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            widget.product.category.toUpperCase(),
                            style: const TextStyle(
                              color: goldColor,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 16),

                          // 3. Price & Ratings row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '₹$calculatedPrice',
                                    style: const TextStyle(
                                      color: goldColor,
                                      fontSize: 28,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  Text(
                                    'Pack Price for $_selectedWeight',
                                    style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardColor,
                                  border: Border.all(color: const Color(0xFFE8D9C5)),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.star_rounded, color: goldColor, size: 16),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${widget.product.rating} / 5.0',
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // 4. Weight Selectors (250g, 500g, 1kg)
                          const Text('Select Imperial Pack Weight', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                          const SizedBox(height: 12),
                          Column(
                            children: _sizesMeta.map((meta) {
                              final val = meta["value"]!;
                              final label = meta["label"]!;
                              final icon = meta["icon"]!;
                              final isSel = _selectedWeight == val;

                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _selectedWeight = val;
                                  });
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).cardColor,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isSel ? goldColor : const Color(0xFFE8D9C5),
                                      width: isSel ? 2.0 : 1.0,
                                    ),
                                    boxShadow: [
                                      if (isSel)
                                        BoxShadow(
                                          color: goldColor.withOpacity(0.24),
                                          blurRadius: 16,
                                          offset: const Offset(0, 6),
                                        ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Text(icon, style: const TextStyle(fontSize: 16)),
                                          const SizedBox(width: 12),
                                          Text(
                                            label,
                                            style: TextStyle(
                                              fontWeight: isSel ? FontWeight.w900 : FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                      Text(
                                        '₹${widget.product.getPriceForWeight(val)}',
                                        style: TextStyle(
                                          color: isSel ? goldColor : Theme.of(context).textTheme.bodyLarge?.color,
                                          fontWeight: FontWeight.w900,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 24),

                          // 5. Product Description
                          const Text('Product Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                          const SizedBox(height: 8),
                          Text(
                            widget.product.description,
                            style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12, height: 1.5),
                          ),
                          const SizedBox(height: 24),

                          // 6. Premium Nutrition Facts
                          const Text('Luxury Nutrition Facts (per 100g)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                          const SizedBox(height: 12),
                          Container(
                            decoration: BoxDecoration(
                              color: Theme.of(context).cardColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE8D9C5)),
                            ),
                            padding: const EdgeInsets.all(16),
                            child: Table(
                              border: TableBorder.symmetric(inside: const BorderSide(color: Color(0xFFE8D9C5), width: 0.5)),
                              children: const [
                                TableRow(
                                  children: [
                                    Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Text("Calories", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold))),
                                    Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Text("580 kcal", style: TextStyle(fontSize: 11), textAlign: TextAlign.right)),
                                  ],
                                ),
                                TableRow(
                                  children: [
                                    Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Text("Protein", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold))),
                                    Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Text("20.3 g", style: TextStyle(fontSize: 11), textAlign: TextAlign.right)),
                                  ],
                                ),
                                TableRow(
                                  children: [
                                    Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Text("Dietary Fiber", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold))),
                                    Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Text("10.5 g", style: TextStyle(fontSize: 11), textAlign: TextAlign.right)),
                                  ],
                                ),
                                TableRow(
                                  children: [
                                    Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Text("Healthy Fats", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold))),
                                    Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Text("45.2 g", style: TextStyle(fontSize: 11), textAlign: TextAlign.right)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // 7. Dynamic Reviews list
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: const [
                              Text('Customer Reviews', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                              Text('See All (42)', style: TextStyle(color: goldColor, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildReviewRow("Shubharavi C.", "Absolutely pristine standard! Hand-selected nuts, safety sealed packaging. Full rating!", 5),
                          _buildReviewRow("Ramesh S.", "Delivered in exactly 12 minutes! Incredibly fresh and crunchy. Reordering almonds.", 5),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Sticky dual action bottom bar
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  border: Border(top: BorderSide(color: goldColor.withOpacity(0.24), width: 1.2)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.06),
                      blurRadius: 16,
                      offset: const Offset(0, -6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // 1. ADD TO PATRON CART
                    Expanded(
                      child: ScaleTransition(
                        scale: _bounceAnimation,
                        child: ElevatedButton(
                          onPressed: () => _triggerAddToCart(context),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                            foregroundColor: const Color(0xFF3E2723),
                            minimumSize: const Size.fromHeight(48),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: Color(0xFF3E2723), width: 1.5),
                            ),
                          ),
                          child: const Text(
                            'ADD TO CART',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // 2. BUY NOW
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          context.read<AppState>().updateCart(widget.product.id, _selectedWeight, 1);
                          widget.onBuyNow();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3E2723),
                          foregroundColor: const Color(0xFFFAF7F2),
                          minimumSize: const Size.fromHeight(48),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: goldColor, width: 1.5),
                          ),
                        ),
                        child: const Text(
                          'BUY NOW',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewRow(String name, String comment, int stars) {
    const goldColor = Color(0xFFD4A373);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.04),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(name, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              Row(
                children: List.generate(5, (index) => Icon(Icons.star_rounded, color: index < stars ? goldColor : Colors.grey[300], size: 12)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(comment, style: const TextStyle(fontSize: 10, color: Colors.grey, height: 1.4)),
        ],
      ),
    );
  }
}
