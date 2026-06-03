import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/address.dart';
import '../widgets/premium_feedback.dart';
import '../widgets/luxury_loading.dart';
import '../services/app_error_mapper.dart';

class AddressManagementScreen extends StatefulWidget {
  final VoidCallback onBack;

  const AddressManagementScreen({Key? key, required this.onBack}) : super(key: key);

  @override
  State<AddressManagementScreen> createState() => _AddressManagementScreenState();
}

class _AddressManagementScreenState extends State<AddressManagementScreen> {
  // Form Controllers
  final _addressLineController = TextEditingController();
  final _cityController = TextEditingController();
  final _pinCodeController = TextEditingController();
  final _nameController = TextEditingController();
  final _contactPhoneController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _stateController = TextEditingController();

  @override
  void dispose() {
    _addressLineController.dispose();
    _cityController.dispose();
    _pinCodeController.dispose();
    _nameController.dispose();
    _contactPhoneController.dispose();
    _landmarkController.dispose();
    _stateController.dispose();
    super.dispose();
  }

  void _showAddAddressDialog() {
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
            color: const Color(0xFFFAF7F2), // Warm Cream Light Theme
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
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF2C160B)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Color(0xFF2C160B)),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const Divider(color: Color(0xFFE8D9C5)),
                const SizedBox(height: 12),

                _buildModalField("Full Name", _nameController, "e.g., Ravishankar"),
                const SizedBox(height: 12),
                _buildModalField("Contact Phone", _contactPhoneController, "10-digit number", keyboardType: TextInputType.phone),
                const SizedBox(height: 12),
                _buildModalField("Address Line / Street", _addressLineController, "e.g., Whitefield, Bengaluru"),
                const SizedBox(height: 12),
                _buildModalField("Landmark (Optional)", _landmarkController, "e.g., Near Main Market"),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildModalField("City", _cityController, "e.g., Bengaluru"),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildModalField("State", _stateController, "e.g., Karnataka"),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildModalField("Pin Code", _pinCodeController, "e.g., 560066", keyboardType: TextInputType.number),
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
                    LuxuryLoading.show(context, message: "Saving your premium address...");

                    try {
                      final success = await appState.addAddress(newAddress);
                      LuxuryLoading.dismiss(context);
                      if (success) {
                        _addressLineController.clear();
                        _cityController.clear();
                        _pinCodeController.clear();
                        _landmarkController.clear();
                        _stateController.clear();

                        PremiumFeedback.showSuccess(context, "Address saved successfully ✨");
                      } else {
                        PremiumFeedback.showError(context, "Something went wrong. Please try again.");
                      }
                    } catch (e) {
                      LuxuryLoading.dismiss(context);
                      PremiumFeedback.showError(context, AppErrorMapper.map(e));
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

  void _showEditAddressDialog(SavedAddress address) {
    final appState = context.read<AppState>();

    _nameController.text = address.name;
    _contactPhoneController.text = address.contactPhone;
    _addressLineController.text = address.addressLine;
    _cityController.text = address.city;
    _pinCodeController.text = address.pinCode;
    _landmarkController.text = address.landmark;
    _stateController.text = address.state;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFFFAF7F2), // Light theme background
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
                      "Edit Address",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF2C160B)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Color(0xFF2C160B)),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const Divider(color: Color(0xFFE8D9C5)),
                const SizedBox(height: 12),

                _buildModalField("Full Name", _nameController, "e.g., Ravishankar"),
                const SizedBox(height: 12),
                _buildModalField("Contact Phone", _contactPhoneController, "10-digit number", keyboardType: TextInputType.phone),
                const SizedBox(height: 12),
                _buildModalField("Address Line / Street", _addressLineController, "e.g., Whitefield, Bengaluru"),
                const SizedBox(height: 12),
                _buildModalField("Landmark (Optional)", _landmarkController, "e.g., Near Main Market"),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildModalField("City", _cityController, "e.g., Bengaluru"),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildModalField("State", _stateController, "e.g., Karnataka"),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildModalField("Pin Code", _pinCodeController, "e.g., 560066", keyboardType: TextInputType.number),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: () async {
                    if (_nameController.text.trim().isEmpty ||
                        _contactPhoneController.text.trim().isEmpty ||
                        _addressLineController.text.trim().isEmpty ||
                        _cityController.text.trim().isEmpty ||
                        _stateController.text.trim().isEmpty ||
                        _pinCodeController.text.trim().isEmpty) {
                      PremiumFeedback.showError(context, "Please fill all required fields.");
                      return;
                    }

                    final updatedAddress = SavedAddress(
                      id: address.id,
                      phone: address.phone,
                      name: _nameController.text.trim(),
                      contactPhone: _contactPhoneController.text.trim(),
                      isDefault: address.isDefault,
                      createdAt: address.createdAt,
                      addressLine: _addressLineController.text.trim(),
                      city: _cityController.text.trim(),
                      pinCode: _pinCodeController.text.trim(),
                      landmark: _landmarkController.text.trim(),
                      state: _stateController.text.trim(),
                    );

                    Navigator.of(ctx).pop();
                    LuxuryLoading.show(context, message: "Updating your premium address...");

                    try {
                      final success = await appState.updateAddress(updatedAddress);
                      LuxuryLoading.dismiss(context);
                      if (success) {
                        _addressLineController.clear();
                        _cityController.clear();
                        _pinCodeController.clear();
                        _landmarkController.clear();
                        _stateController.clear();

                        PremiumFeedback.showSuccess(context, "Address saved successfully ✨");
                      } else {
                        PremiumFeedback.showError(context, "Something went wrong. Please try again.");
                      }
                    } catch (e) {
                      LuxuryLoading.dismiss(context);
                      PremiumFeedback.showError(context, AppErrorMapper.map(e));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3E2723),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("Save Changes", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
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
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF2C160B)),
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

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    const goldColor = Color(0xFFD4A373);

    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2), // Forced Light Theme background
      appBar: AppBar(
        title: const Text(
          "Address Management",
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF2C160B)),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF2C160B)),
          onPressed: widget.onBack,
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => appState.refreshCatalog(),
          color: goldColor,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top header card with quick explanation
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3E2723), // Dark Walnut theme
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: goldColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on_rounded, color: goldColor, size: 28),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              "Delivery Locations",
                              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(height: 4),
                            Text(
                              "Select your default shipping destination for express checkout.",
                              style: TextStyle(color: Colors.white70, fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Saved Addresses header with add new button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "SAVED DESTINATIONS",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5, color: Color(0xFF2C160B)),
                    ),
                    ElevatedButton.icon(
                      onPressed: _showAddAddressDialog,
                      icon: const Icon(Icons.add_location_alt_rounded, size: 14),
                      label: const Text("Add New", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: goldColor.withOpacity(0.12),
                        foregroundColor: goldColor,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                if (appState.addresses.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE8D9C5)),
                    ),
                    child: Column(
                      children: const [
                        Icon(Icons.location_off_outlined, color: Colors.grey, size: 40),
                        SizedBox(height: 12),
                        Text("No Saved Addresses Found", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF2C160B))),
                        SizedBox(height: 4),
                        Text("Add your address to enjoy fast checkout.", style: TextStyle(fontSize: 10, color: Colors.grey)),
                      ],
                    ),
                  )
                else
                  ...appState.addresses.map((address) => _buildAddressCard(address, appState)).toList(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAddressCard(SavedAddress address, AppState appState) {
    const goldColor = Color(0xFFD4A373);
    const walnutColor = Color(0xFF2C160B);

    return GestureDetector(
      onTap: () async {
        if (!address.isDefault) {
          LuxuryLoading.show(context, message: "Setting as default...");
          try {
            await appState.setDefaultAddress(address.id);
            LuxuryLoading.dismiss(context);
            PremiumFeedback.showSuccess(context, "Address saved successfully ✨");
          } catch (e) {
            LuxuryLoading.dismiss(context);
            PremiumFeedback.showError(context, AppErrorMapper.map(e));
          }
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: address.isDefault ? goldColor : const Color(0xFFE8D9C5),
            width: address.isDefault ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: address.isDefault ? goldColor.withOpacity(0.12) : Colors.grey.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                address.isDefault ? Icons.star_rounded : Icons.location_on_outlined,
                color: address.isDefault ? goldColor : Colors.grey,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        address.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: walnutColor),
                      ),
                      if (address.isDefault)
                        const Text(
                          "DEFAULT",
                          style: TextStyle(color: goldColor, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "${address.addressLine}${address.landmark.isNotEmpty ? ', ${address.landmark}' : ''}",
                    style: const TextStyle(color: Color(0xFF5D4037), fontSize: 11, height: 1.4),
                  ),
                  Text(
                    "${address.city}, ${address.state} - ${address.pinCode}",
                    style: const TextStyle(color: Color(0xFF5D4037), fontSize: 11, height: 1.4),
                  ),
                  if (address.contactPhone.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      "Phone: +91 ${address.contactPhone}",
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: walnutColor),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.edit_outlined, color: Colors.grey, size: 18),
              onPressed: () => _showEditAddressDialog(address),
              constraints: const BoxConstraints(),
              padding: EdgeInsets.zero,
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFF7B2D26), size: 18),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    title: const Text("Delete Address?", style: TextStyle(fontWeight: FontWeight.bold, color: walnutColor)),
                    content: const Text("Remove this saved address permanently?", style: TextStyle(fontSize: 13, color: Color(0xFF5D4037))),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(false),
                        child: const Text("Cancel", style: TextStyle(color: Colors.grey)),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.of(ctx).pop(true),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7B2D26), foregroundColor: Colors.white),
                        child: const Text("Delete"),
                      ),
                    ],
                  ),
                );

                if (confirm == true) {
                  LuxuryLoading.show(context, message: "Removing address...");
                  try {
                    await appState.removeAddress(address.id);
                    LuxuryLoading.dismiss(context);
                    PremiumFeedback.showSuccess(context, "Address saved successfully ✨");
                  } catch (e) {
                    LuxuryLoading.dismiss(context);
                    PremiumFeedback.showError(context, AppErrorMapper.map(e));
                  }
                }
              },
              constraints: const BoxConstraints(),
              padding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }
}
