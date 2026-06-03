import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/product.dart';
import '../models/offer.dart';
import '../models/address.dart';
import '../widgets/premium_interactive.dart';

class HomeScreen extends StatefulWidget {
  final Function(Product) onProductSelected;
  final VoidCallback onProfileTapped;
  final VoidCallback onOffersTapped;
  final VoidCallback onNotificationsTapped;
  final VoidCallback onAddressTapped;

  const HomeScreen({
    Key? key,
    required this.onProductSelected,
    required this.onProfileTapped,
    required this.onOffersTapped,
    required this.onNotificationsTapped,
    required this.onAddressTapped,
  }) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _selectedCategory = "all";
  String _searchQuery = "";
  final _searchController = TextEditingController();

  final List<String> _categories = [
    "all",
    "almonds",
    "cashews",
    "pistachios",
    "dates",
    "raisins",
    "walnuts",
    "figs",
    "saffron",
    "seeds",
    "snacks",
    "gifts",
    "chocolates"
  ];

  final Map<String, Map<String, String>> _categoryMeta = {
    "all": {"label": "All Items", "icon": "✨"},
    "almonds": {"label": "Almonds", "icon": "🥜"},
    "cashews": {"label": "Cashews", "icon": "🌰"},
    "pistachios": {"label": "Pistachios", "icon": "🟢"},
    "dates": {"label": "Dates", "icon": "🌴"},
    "raisins": {"label": "Raisins", "icon": "🍇"},
    "walnuts": {"label": "Walnuts", "icon": "🪵"},
    "figs": {"label": "Anjeer Figs", "icon": "🍯"},
    "saffron": {"label": "Kashmir Saffron", "icon": "🌸"},
    "seeds": {"label": "Super Seeds", "icon": "🌱"},
    "snacks": {"label": "Snack Mixes", "icon": "🍿"},
    "gifts": {"label": "Luxury Gifts", "icon": "🎁"},
    "chocolates": {"label": "Chocolates", "icon": "🍫"},
  };

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Find the default address to display dynamically
    final defaultAddress = appState.addresses.firstWhere(
      (addr) => addr.isDefault,
      orElse: () => SavedAddress(
        id: '',
        phone: '',
        name: '',
        contactPhone: '',
        isDefault: false,
        createdAt: '',
        addressLine: '',
        city: '',
        pinCode: '',
      ),
    );

    final hasDefault = defaultAddress.id.isNotEmpty;

    // Apply filters
    final filteredProducts = appState.products.where((product) {
      final matchesCategory = _selectedCategory == "all" || product.category == _selectedCategory;
      final matchesSearch = product.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          product.description.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();

    return RefreshIndicator(
      onRefresh: () => appState.refreshCatalog(),
      color: const Color(0xFFD4A373),
      child: CustomScrollView(
        slivers: [
          // 1. Pinned Zero-Jitter Collapsing Luxury Header
          SliverAppBar(
            pinned: true,
            expandedHeight: 160.0 + 62.0 + MediaQuery.of(context).padding.top,
            backgroundColor: isDark ? const Color(0xFF0F240C) : const Color(0xFF1E3516),
            elevation: 0,
            automaticallyImplyLeading: false,
            primary: true,
            toolbarHeight: 0,
            flexibleSpace: LayoutBuilder(
              builder: (BuildContext context, BoxConstraints constraints) {
                final topPadding = MediaQuery.of(context).padding.top;
                final minHeight = 62.0 + topPadding;
                final maxHeight = 160.0 + 62.0 + topPadding;
                
                // Interpolate opacity ratio smoothly based on current scrolling height constraints
                double collapsePercent = 1.0;
                if (constraints.maxHeight <= minHeight) {
                  collapsePercent = 0.0;
                } else if (constraints.maxHeight >= maxHeight) {
                  collapsePercent = 1.0;
                } else {
                  collapsePercent = (constraints.maxHeight - minHeight) / (maxHeight - minHeight);
                }
                
                final opacity = Curves.easeInOut.transform(collapsePercent);

                return Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [const Color(0xFF0F240C), const Color(0xFF2C5E2D).withOpacity(0.85)]
                          : [const Color(0xFF1E3516), const Color(0xFF386B39).withOpacity(0.92)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(24),
                      bottomRight: Radius.circular(24),
                    ),
                  ),
                  child: SafeArea(
                    top: true,
                    bottom: false,
                    child: SingleChildScrollView(
                      physics: const NeverScrollableScrollPhysics(),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                        child: Opacity(
                          opacity: opacity,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Brand title and avatar
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Row(
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(10),
                                          child: Image.asset(
                                            'assets/logo.png',
                                            width: 53,
                                            height: 53,
                                            fit: BoxFit.contain,
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Text(
                                                'Pista Bajar',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w900,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                              Text(
                                                'Customer: ${appState.userName ?? "Guest Patron"}',
                                                style: const TextStyle(
                                                  color: Color(0xFFD4A373),
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Row(
                                    children: [
                                      _buildHeaderIcon(Icons.percent_rounded, widget.onOffersTapped),
                                      const SizedBox(width: 8),
                                      _buildHeaderIcon(Icons.notifications_none_rounded, widget.onNotificationsTapped),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              // Address Bar (ETA Delivery)
                              GestureDetector(
                                onTap: widget.onAddressTapped,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFFD4A373).withOpacity(0.3), width: 1.2),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.center,
                                          children: [
                                            const Text('📍', style: TextStyle(fontSize: 20)),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: hasDefault
                                                    ? [
                                                        const Text(
                                                          "Delivering To",
                                                          style: TextStyle(
                                                            color: Colors.white60,
                                                            fontSize: 9,
                                                            fontWeight: FontWeight.bold,
                                                            letterSpacing: 0.5,
                                                          ),
                                                        ),
                                                        Text(
                                                          defaultAddress.name,
                                                          style: const TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 12,
                                                            fontWeight: FontWeight.w900,
                                                          ),
                                                          maxLines: 1,
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                        Text(
                                                          "${defaultAddress.addressLine}, ${defaultAddress.city}",
                                                          style: const TextStyle(
                                                            color: Colors.white70,
                                                            fontSize: 10,
                                                            fontWeight: FontWeight.w500,
                                                          ),
                                                          maxLines: 1,
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                        if (defaultAddress.pinCode.isNotEmpty)
                                                          Text(
                                                            defaultAddress.pinCode,
                                                            style: const TextStyle(
                                                              color: Color(0xFFD4A373),
                                                              fontSize: 10,
                                                              fontWeight: FontWeight.w900,
                                                            ),
                                                          ),
                                                      ]
                                                    : [
                                                        const Text(
                                                          "Delivering To",
                                                          style: TextStyle(
                                                            color: Colors.white60,
                                                            fontSize: 9,
                                                            fontWeight: FontWeight.bold,
                                                            letterSpacing: 0.5,
                                                          ),
                                                        ),
                                                        const Text(
                                                          "Guest Patron",
                                                          style: TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 12,
                                                            fontWeight: FontWeight.w900,
                                                          ),
                                                        ),
                                                        const Text(
                                                          "Select / Add Delivery Address ➔",
                                                          style: TextStyle(
                                                            color: Color(0xFFD4A373),
                                                            fontSize: 10,
                                                            fontWeight: FontWeight.bold,
                                                          ),
                                                        ),
                                                      ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      const Icon(Icons.chevron_right_rounded, color: Color(0xFFD4A373), size: 20),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(62.0),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F240C) : const Color(0xFF1E3516),
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(24),
                    bottomRight: Radius.circular(24),
                  ),
                  border: const Border(
                    bottom: BorderSide(color: Color(0xFFD4A373), width: 1.5),
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Container(
                  height: 46,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val;
                      });
                    },
                    style: const TextStyle(color: Colors.black, fontSize: 13, fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      hintText: "Search raw almonds, Kashmir kesar...",
                      hintStyle: TextStyle(color: Colors.black.withOpacity(0.35), fontSize: 12, fontWeight: FontWeight.w500),
                      prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFFD4A373), size: 20),
                      prefixIconConstraints: const BoxConstraints(minWidth: 42, minHeight: 46),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.only(left: 0, right: 12, top: 12, bottom: 12),
                    ),
                  ),
                ),
              ),
            ),
          ),
          
          // 2. Banner/Combos Slider Section
          if (appState.offers.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: GestureDetector(
                  onTap: widget.onOffersTapped,
                  child: _buildFeaturedCombo(appState.offers.first),
                ),
              ),
            ),

          // 3. Category Chip filter row
          SliverToBoxAdapter(
            child: Container(
              height: 48,
              margin: const EdgeInsets.only(top: 20, bottom: 6),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final meta = _categoryMeta[cat]!;
                  final isSel = _selectedCategory == cat;

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedCategory = cat;
                      });
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSel ? const Color(0xFF3E2723) : Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSel ? const Color(0xFF3E2723) : const Color(0xFFE8D9C5),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Text(meta["icon"]!, style: const TextStyle(fontSize: 14)),
                          const SizedBox(width: 6),
                          Text(
                            meta["label"]!,
                            style: TextStyle(
                              color: isSel ? Colors.white : Theme.of(context).textTheme.bodyLarge?.color,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // 4. Products Grid Section
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
            sliver: appState.isLoading
                ? SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 0.68,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => const ShimmerLoading(
                        width: double.infinity,
                        height: double.infinity,
                        borderRadius: 20,
                      ),
                      childCount: 6,
                    ),
                  )
                : appState.catalogError != null
                    ? SliverToBoxAdapter(
                        child: RetryStateWidget(
                          message: appState.catalogError!,
                          onRetry: () => appState.refreshCatalog(),
                          isLoading: appState.isLoading,
                        ),
                      )
                    : filteredProducts.isEmpty
                        ? const SliverToBoxAdapter(
                            child: Center(
                              child: Padding(
                                padding: EdgeInsets.symmetric(vertical: 40),
                                child: Text(
                                  "No organic products match your query.",
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                                ),
                              ),
                            ),
                          )
                        : SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 16,
                              crossAxisSpacing: 16,
                              childAspectRatio: 0.68,
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final product = filteredProducts[index];
                                return _buildProductCard(context, product);
                              },
                              childCount: filteredProducts.length,
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withOpacity(0.12), width: 1),
        ),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }

  Widget _buildFeaturedCombo(Offer offer) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2C160B), Color(0xFF6B2D13)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD4A373).withOpacity(0.24), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF532A12).withOpacity(0.18),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '🔥 GRAND LAUNCH COMBOS',
                style: TextStyle(
                  color: Color(0xFFFFE1BD),
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.1,
                ),
              ),
              if (offer.discountCode.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD4A373).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFD4A373)),
                  ),
                  child: Text(
                    offer.discountCode,
                    style: const TextStyle(color: Color(0xFFD4A373), fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            offer.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            offer.description,
            style: const TextStyle(
              color: Color(0xFFFFF3E4),
              fontSize: 11,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, Product product) {
    return AnimatedTapScale(
      onTap: () => widget.onProductSelected(product),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3E2723).withOpacity(0.06),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image area
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                  child: Hero(
                    tag: 'product_image_${product.id}',
                    child: AspectRatio(
                      aspectRatio: 1.45,
                      child: Image.network(
                        product.imageUrl,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
                if (product.soldOut)
                  Positioned(
                    left: 10,
                    top: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7B2D26),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'SOLD OUT',
                        style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
              ],
            ),
            
            // Text Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      product.description,
                      style: TextStyle(
                        color: Theme.of(context).hintColor,
                        fontSize: 10,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '₹${product.price1kg}/kg',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFD4A373),
                              ),
                            ),
                            const Text(
                              'Premium Standard',
                              style: TextStyle(fontSize: 8, color: Colors.grey),
                            ),
                          ],
                        ),
                        // Add Button arrow indicator
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: const Color(0xFF3E2723),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.arrow_forward_rounded,
                            color: Colors.white,
                            size: 14,
                          ),
                        ),
                      ],
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
}
