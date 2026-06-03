import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/product.dart';
import '../models/address.dart';
import '../widgets/premium_feedback.dart';
import '../services/error_handler.dart';

class CartScreen extends StatefulWidget {
  final VoidCallback onProceedToCheckout;
  final VoidCallback? onShopNow;

  const CartScreen({
    Key? key,
    required this.onProceedToCheckout,
    this.onShopNow,
  }) : super(key: key);

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _couponController = TextEditingController();
  final _giftNoteController = TextEditingController();
  final _addressLineController = TextEditingController();
  final _cityController = TextEditingController();
  final _pinCodeController = TextEditingController();
  final _nameController = TextEditingController();
  final _contactPhoneController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _stateController = TextEditingController();

  SavedAddress? _selectedAddress;

  @override
  void dispose() {
    _couponController.dispose();
    _giftNoteController.dispose();
    _addressLineController.dispose();
    _cityController.dispose();
    _pinCodeController.dispose();
    _nameController.dispose();
    _contactPhoneController.dispose();
    _landmarkController.dispose();
    _stateController.dispose();
    super.dispose();
  }

  String _formatExpiry(String dateStr) {
    if (dateStr.isEmpty) return "Active Promotion";
    try {
      final date = DateTime.parse(dateStr);
      final months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return "Expires ${date.day} ${months[date.month - 1]}";
    } catch (_) {
      return "Expires $dateStr";
    }
  }

  void _confirmRemoveItem(BuildContext context, String prodId, String selectedWeight) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          "Remove Item?",
          style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2C160B)),
        ),
        content: const Text(
          "Are you sure you want to remove this premium selection from your cart?",
          style: TextStyle(fontSize: 13, color: Color(0xFF5D4037)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("Cancel", style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.read<AppState>().updateCart(prodId, selectedWeight, 0);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7B2D26),
              foregroundColor: Colors.white,
            ),
            child: const Text("Remove"),
          ),
        ],
      ),
    );
  }

  void _showAvailableCouponsSheet(BuildContext context) {
    final appState = context.read<AppState>();
    const goldColor = Color(0xFFD4A373);
    const darkWalnut = Color(0xFF2C160B);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFFFAF7F2),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            border: Border.all(color: const Color(0xFFE8D9C5), width: 1.5),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.7,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Available Promo Coupons",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: darkWalnut),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: darkWalnut),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const Divider(color: Color(0xFFE8D9C5)),
              const SizedBox(height: 12),
              
              if (appState.offers.isEmpty)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Text("🎟️", style: TextStyle(fontSize: 40)),
                        SizedBox(height: 12),
                        Text(
                          "No Promo Coupons Available",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: darkWalnut),
                        ),
                        SizedBox(height: 4),
                        Text(
                          "Check back soon for standard launch promotions!",
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    itemCount: appState.offers.length,
                    itemBuilder: (context, index) {
                      final offer = appState.offers[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE8D9C5)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: goldColor.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: goldColor.withOpacity(0.3)),
                                  ),
                                  child: Text(
                                    offer.code.toUpperCase(),
                                    style: const TextStyle(
                                      color: goldColor,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                Text(
                                  _formatExpiry(offer.expiryDate),
                                  style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              "${offer.discount}% OFF Premium Selection",
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: darkWalnut),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              offer.description,
                              style: const TextStyle(fontSize: 11, color: Colors.grey, height: 1.4),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "Min. Order: ₹${offer.minimumOrder}",
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF5D4037)),
                                ),
                                ElevatedButton(
                                  onPressed: () async {
                                    Navigator.of(ctx).pop();
                                    final error = await appState.applyCoupon(offer.code);
                                    if (error != null) {
                                      if (context.mounted) {
                                        PremiumFeedback.showError(context, error);
                                      }
                                    } else {
                                      if (context.mounted) {
                                        PremiumFeedback.showSuccess(context, "Coupon Applied Successfully! ✨");
                                      }
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: darkWalnut,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                    minimumSize: const Size(60, 30),
                                  ),
                                  child: const Text("Apply", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildModalField(
    String label,
    TextEditingController controller,
    String hint, {
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: Colors.grey.withOpacity(0.08),
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
              border: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }

  void _showAddAddressDialog(BuildContext context) {
    final appState = context.read<AppState>();
    
    // Autofill name and phone if available
    _nameController.text = appState.userName ?? "";
    _contactPhoneController.text = appState.userPhone ?? "";
    _addressLineController.clear();
    _cityController.clear();
    _pinCodeController.clear();
    _landmarkController.clear();
    _stateController.clear();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(ctx).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            border: Border.all(color: const Color(0xFFE8D9C5), width: 1.5),
          ),
          padding: EdgeInsets.only(
            top: 24,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Add Saved Address",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const Divider(color: Color(0xFFE8D9C5)),
                const SizedBox(height: 12),
                
                // Form Fields
                _buildModalField("Full Name", _nameController, "e.g., Shubha Ravi"),
                const SizedBox(height: 12),
                _buildModalField("Contact Phone", _contactPhoneController, "10-digit number", keyboardType: TextInputType.phone),
                const SizedBox(height: 12),
                _buildModalField("Address Line / Street", _addressLineController, "e.g., Flat 405, Gold Apartments"),
                const SizedBox(height: 12),
                _buildModalField("Landmark (Optional)", _landmarkController, "e.g., Near City Mall"),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildModalField("City", _cityController, "e.g., Bangalore"),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildModalField("State", _stateController, "e.g., Karnataka"),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildModalField("Pin Code", _pinCodeController, "e.g., 560001", keyboardType: TextInputType.number),
                const SizedBox(height: 24),
                
                ElevatedButton(
                  onPressed: () async {
                    if (_nameController.text.trim().isEmpty ||
                        _contactPhoneController.text.trim().isEmpty ||
                        _addressLineController.text.trim().isEmpty ||
                        _cityController.text.trim().isEmpty ||
                        _stateController.text.trim().isEmpty ||
                        _pinCodeController.text.trim().isEmpty) {
                      PremiumFeedback.showError(context, "Please fill all required address fields.");
                      return;
                    }

                    final newAddress = SavedAddress(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      phone: appState.userPhone ?? "",
                      name: _nameController.text.trim(),
                      contactPhone: _contactPhoneController.text.trim(),
                      isDefault: appState.addresses.isEmpty,
                      createdAt: DateTime.now().toIso8601String(),
                      addressLine: _addressLineController.text.trim(),
                      city: _cityController.text.trim(),
                      pinCode: _pinCodeController.text.trim(),
                      landmark: _landmarkController.text.trim(),
                      state: _stateController.text.trim(),
                    );

                    Navigator.of(ctx).pop();
                    
                    try {
                      final success = await appState.addAddress(newAddress);
                      if (success) {
                        // Clear controllers
                        _addressLineController.clear();
                        _cityController.clear();
                        _pinCodeController.clear();
                        _landmarkController.clear();
                        _stateController.clear();
                        
                        PremiumFeedback.showSuccess(context, "Address saved successfully ✨");
                      } else {
                        PremiumFeedback.showError(context, "Failed to save address.");
                      }
                    } catch (e) {
                      PremiumFeedback.showError(context, ErrorHandler.map(e));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3E2723),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("Save Address Details", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const goldColor = Color(0xFFD4A373);
    const darkWalnut = Color(0xFF2C160B);

    if (appState.cart.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Patron Cart', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
          centerTitle: true,
          elevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: goldColor.withOpacity(0.08),
                    shape: BoxShape.circle,
                    border: Border.all(color: goldColor.withOpacity(0.24), width: 1.5),
                  ),
                  child: const Center(
                    child: Text('🛒', style: TextStyle(fontSize: 44)),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Your Cart is Empty',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: darkWalnut),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Explore our curated collections of handpicked premium almonds, fresh pistachios, and royal saffron.',
                  style: TextStyle(color: Colors.grey, fontSize: 12, height: 1.45),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                if (widget.onShopNow != null)
                  ElevatedButton.icon(
                    onPressed: widget.onShopNow,
                    icon: const Icon(Icons.storefront_rounded, size: 16),
                    label: const Text('Shop Organic Selections ➔', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: darkWalnut,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(220, 48),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    }

    // Default select active default address
    if (_selectedAddress == null && appState.addresses.isNotEmpty) {
      _selectedAddress = appState.addresses.firstWhere((a) => a.isDefault, orElse: () => appState.addresses.first);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Patron Cart', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 260),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // List of Cart Items
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: appState.cart.length,
              itemBuilder: (context, index) {
                final entry = appState.cart.entries.elementAt(index);
                final prodId = entry.key;
                final cartItem = entry.value;

                final product = appState.products.firstWhere(
                  (p) => p.id == prodId,
                  orElse: () => Product(
                    id: '',
                    name: '',
                    description: '',
                    imageUrl: '',
                    category: '',
                    stock: 0,
                    price250g: 0,
                    price500g: 0,
                    price1kg: 0,
                    rating: 0.0,
                  ),
                );

                if (product.id.isEmpty) return const SizedBox.shrink();

                final price = product.getPriceForWeight(cartItem.selectedWeight);
                final lineTotal = (price * cartItem.quantity).round();

                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: const BorderSide(color: Color(0xFFE8D9C5)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Responsive Product Image container
                        Container(
                          width: 76,
                          height: 76,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(13),
                            child: Image.network(
                              product.imageUrl,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        // Title and pricing info with full wrapping support
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                product.name,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: darkWalnut),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${cartItem.selectedWeight} pack • ₹$price',
                                style: const TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Total: ₹$lineTotal',
                                style: const TextStyle(color: goldColor, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Sleek, compact quantity controls
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.grey.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove_rounded, size: 16, color: Colors.grey),
                                constraints: const BoxConstraints(),
                                padding: const EdgeInsets.all(6),
                                onPressed: () {
                                  if (cartItem.quantity <= 1) {
                                    _confirmRemoveItem(context, prodId, cartItem.selectedWeight);
                                  } else {
                                    appState.updateCart(prodId, cartItem.selectedWeight, cartItem.quantity - 1);
                                  }
                                },
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: Text(
                                  '${cartItem.quantity.toInt()}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: darkWalnut),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_rounded, size: 16, color: goldColor),
                                constraints: const BoxConstraints(),
                                padding: const EdgeInsets.all(6),
                                onPressed: () {
                                  appState.updateCart(prodId, cartItem.selectedWeight, cartItem.quantity + 1);
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            // Coupon Code container
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: const BorderSide(color: Color(0xFFD4A373), width: 1.2),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('APPLY PROMO COUPON', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5, color: darkWalnut)),
                      const SizedBox(height: 12),
                      if (appState.discountCode != null) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.check_circle_rounded, color: Colors.green, size: 18),
                                const SizedBox(width: 8),
                                Text(
                                  'ACTIVE: ${appState.discountCode}',
                                  style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ],
                            ),
                            TextButton(
                              onPressed: () => appState.removeCoupon(),
                              child: const Text('Remove', style: TextStyle(color: Color(0xFF7B2D26), fontWeight: FontWeight.bold, fontSize: 12)),
                            ),
                          ],
                        ),
                      ] else ...[
                        GestureDetector(
                          onTap: () => _showAvailableCouponsSheet(context),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: goldColor.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: goldColor.withOpacity(0.3), width: 1),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: const [
                                Row(
                                  children: [
                                    Icon(Icons.confirmation_number_outlined, color: goldColor, size: 20),
                                    SizedBox(width: 10),
                                    Text(
                                      "Select promo code coupon...",
                                      style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                  ],
                                ),
                                Icon(Icons.arrow_forward_ios_rounded, color: goldColor, size: 14),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),

            // Festive Gift wrap configurations
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: const BorderSide(color: Color(0xFFE8D9C5)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: const [
                              Text('🎁', style: TextStyle(fontSize: 16)),
                              SizedBox(width: 8),
                              Text('Send as a Festive Gift?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: darkWalnut)),
                            ],
                          ),
                          Switch(
                            value: appState.isGift,
                            onChanged: (val) {
                              appState.setGiftPreferences(
                                isGift: val,
                                note: _giftNoteController.text.trim(),
                                wrap: appState.giftWrap,
                              );
                            },
                            activeColor: goldColor,
                          ),
                        ],
                      ),
                      if (appState.isGift) ...[
                        const Divider(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Festive Gift Wrapping (₹49)', style: TextStyle(fontSize: 12, color: darkWalnut)),
                            Checkbox(
                              value: appState.giftWrap,
                              onChanged: (val) {
                                appState.setGiftPreferences(
                                  isGift: true,
                                  note: _giftNoteController.text.trim(),
                                  wrap: val ?? false,
                                );
                              },
                              activeColor: goldColor,
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _giftNoteController,
                          onChanged: (val) {
                            appState.setGiftPreferences(
                              isGift: true,
                              note: val.trim(),
                              wrap: appState.giftWrap,
                            );
                          },
                          style: const TextStyle(fontSize: 12),
                          decoration: InputDecoration(
                            hintText: 'Enter a custom gift note...',
                            hintStyle: const TextStyle(fontSize: 12),
                            filled: true,
                            fillColor: isDark ? Colors.black26 : Colors.grey[100],
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),

            // Address Selector
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('DELIVERY ADDRESS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5, color: darkWalnut)),
                      TextButton(
                        onPressed: () => _showAddAddressDialog(context),
                        child: const Text('+ Add Address', style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (appState.addresses.isEmpty) ...[
                    const Text('No saved delivery addresses. Please add an address to continue checkout.', style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ] else ...[
                    Column(
                      children: appState.addresses.map((addr) {
                        final isSel = _selectedAddress?.id == addr.id;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedAddress = addr;
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Theme.of(context).cardColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSel ? goldColor : const Color(0xFFE8D9C5),
                                width: isSel ? 1.5 : 1,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.01),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isSel ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                                  color: isSel ? goldColor : Colors.grey,
                                  size: 18,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(addr.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: darkWalnut)),
                                            if (addr.isDefault)
                                              const Text(
                                                "DEFAULT",
                                                style: TextStyle(color: goldColor, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${addr.addressLine}${addr.landmark.isNotEmpty ? ", ${addr.landmark}" : ""}',
                                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                                        ),
                                        Text(
                                          '${addr.city}, ${addr.state} - ${addr.pinCode}',
                                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      // Bottom sticky summary & CTA
      bottomSheet: Container(
        padding: EdgeInsets.fromLTRB(16.0, 16.0, 16.0, MediaQuery.of(context).viewInsets.bottom > 0 ? 16.0 : 92.0),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          border: Border(top: BorderSide(color: goldColor.withOpacity(0.24), width: 1.2)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 16, offset: const Offset(0, -6)),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Pricing summary
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
                  const Text('Festive Gift Wrapping', style: TextStyle(fontSize: 12)),
                  Text('₹${appState.giftWrapFee}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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
                const Text('Total Amount', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                Text(
                  '₹${appState.totalAmount}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFFD4A373)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: (_selectedAddress == null)
                  ? null
                  : () {
                      // Set selected address globally in appState before proceeding
                      widget.onProceedToCheckout();
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: darkWalnut,
                foregroundColor: const Color(0xFFFAF7F2),
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: const Text('PROCEED TO CHECKOUT', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
