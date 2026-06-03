class Address {
  final String addressLine;
  final String city;
  final String pinCode;
  final String landmark;
  final String state;
  final String house;
  final String area;

  Address({
    required this.addressLine,
    required this.city,
    required this.pinCode,
    this.landmark = '',
    this.state = '',
    this.house = '',
    this.area = '',
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      addressLine: (json['addressLine'] ?? json['address_line'] ?? '').toString(),
      city: (json['city'] ?? '').toString(),
      pinCode: (json['pinCode'] ?? json['pin_code'] ?? json['pincode'] ?? '').toString(),
      landmark: (json['landmark'] ?? '').toString(),
      state: (json['state'] ?? '').toString(),
      house: (json['house'] ?? '').toString(),
      area: (json['area'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'addressLine': addressLine,
      'city': city,
      'pinCode': pinCode,
      'landmark': landmark,
      'state': state,
      'house': house,
      'area': area,
    };
  }

  bool get isEmpty => addressLine.isEmpty || city.isEmpty || pinCode.isEmpty;
}

class SavedAddress extends Address {
  final String id;
  final String userId;
  final String name; // maps to full_name
  final String contactPhone; // maps to phone_number
  final String phone; // Keep for backward compatibility
  final bool isDefault;
  final String createdAt;
  final String updatedAt;
  @override
  final String house;
  @override
  final String area;

  SavedAddress({
    required this.id,
    required String phone,
    required this.name,
    required String contactPhone,
    required this.isDefault,
    required this.createdAt,
    String? updatedAt,
    required String addressLine,
    required String city,
    required String pinCode,
    String landmark = '',
    String state = '',
    String? userId,
    String? house,
    String? area,
  })  : userId = userId ?? '',
        phone = phone,
        updatedAt = updatedAt ?? createdAt,
        house = house ?? (addressLine.contains(',') ? addressLine.split(',').first.trim() : addressLine.trim()),
        area = area ?? (addressLine.contains(',') ? addressLine.split(',').sublist(1).join(',').trim() : ''),
        contactPhone = contactPhone.isNotEmpty ? contactPhone : phone,
        super(
          addressLine: addressLine,
          city: city,
          pinCode: pinCode,
          landmark: landmark,
          state: state,
          house: house ?? (addressLine.contains(',') ? addressLine.split(',').first.trim() : addressLine.trim()),
          area: area ?? (addressLine.contains(',') ? addressLine.split(',').sublist(1).join(',').trim() : ''),
        );

  factory SavedAddress.fromJson(Map<String, dynamic> json) {
    final houseVal = (json['house'] ?? '').toString();
    final areaVal = (json['area'] ?? '').toString();
    final streetVal = houseVal.isNotEmpty 
        ? (areaVal.isNotEmpty ? "$houseVal, $areaVal" : houseVal) 
        : (json['address_line'] ?? json['addressLine'] ?? '').toString();

    final isDefaultVal = json['isDefault'] == true || 
        json['isDefault'] == 1 || 
        json['isDefault']?.toString().toLowerCase() == 'true' ||
        json['is_default'] == true || 
        json['is_default'] == 1 || 
        json['is_default']?.toString().toLowerCase() == 'true';

    return SavedAddress(
      id: json['id']?.toString() ?? '',
      phone: json['phone']?.toString() ?? json['phone_number']?.toString() ?? '',
      name: json['name']?.toString() ?? json['full_name']?.toString() ?? '',
      contactPhone: json['contactPhone']?.toString() ?? json['contact_phone']?.toString() ?? json['phone_number']?.toString() ?? '',
      isDefault: isDefaultVal,
      createdAt: json['createdAt']?.toString() ?? json['created_at']?.toString() ?? '',
      updatedAt: json['updatedAt']?.toString() ?? json['updated_at']?.toString(),
      addressLine: streetVal,
      city: json['city']?.toString() ?? '',
      pinCode: json['pinCode']?.toString() ?? json['pin_code']?.toString() ?? json['pincode']?.toString() ?? '',
      landmark: json['landmark']?.toString() ?? '',
      state: json['state']?.toString() ?? '',
      userId: json['userId']?.toString() ?? json['user_id']?.toString() ?? '',
      house: houseVal.isNotEmpty ? houseVal : (streetVal.contains(',') ? streetVal.split(',').first.trim() : streetVal.trim()),
      area: areaVal.isNotEmpty ? areaVal : (streetVal.contains(',') ? streetVal.split(',').sublist(1).join(',').trim() : ''),
    );
  }

  factory SavedAddress.fromSupabaseJson(Map<String, dynamic> json) {
    final houseVal = (json['house'] ?? '').toString();
    final areaVal = (json['area'] ?? '').toString();
    final streetVal = houseVal.isNotEmpty 
        ? (areaVal.isNotEmpty ? "$houseVal, $areaVal" : houseVal) 
        : (json['address_line'] ?? json['addressLine'] ?? '').toString();

    final isDefaultVal = json['is_default'] == true || 
        json['is_default'] == 1 || 
        json['is_default']?.toString().toLowerCase() == 'true' ||
        json['isDefault'] == true || 
        json['isDefault'] == 1 || 
        json['isDefault']?.toString().toLowerCase() == 'true';

    return SavedAddress(
      id: json['id']?.toString() ?? '',
      phone: json['phone_number']?.toString() ?? json['phone']?.toString() ?? '',
      name: json['full_name']?.toString() ?? json['name']?.toString() ?? '',
      contactPhone: json['phone_number']?.toString() ?? json['contact_phone']?.toString() ?? json['contactPhone']?.toString() ?? '',
      isDefault: isDefaultVal,
      createdAt: json['created_at']?.toString() ?? json['createdAt']?.toString() ?? '',
      updatedAt: json['updated_at']?.toString() ?? json['updatedAt']?.toString(),
      addressLine: streetVal,
      city: json['city']?.toString() ?? '',
      pinCode: json['pincode']?.toString() ?? json['pin_code']?.toString() ?? json['pinCode']?.toString() ?? '',
      landmark: json['landmark']?.toString() ?? '',
      state: json['state']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      house: houseVal.isNotEmpty ? houseVal : (streetVal.contains(',') ? streetVal.split(',').first.trim() : streetVal.trim()),
      area: areaVal.isNotEmpty ? areaVal : (streetVal.contains(',') ? streetVal.split(',').sublist(1).join(',').trim() : ''),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final data = super.toJson();
    data.addAll({
      'id': id,
      'userId': userId,
      'phone': phone,
      'name': name,
      'contactPhone': contactPhone,
      'isDefault': isDefault,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'house': house,
      'area': area,
    });
    return data;
  }

  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'user_id': userId,
      'full_name': name,
      'phone_number': contactPhone,
      'house': house,
      'area': area,
      'landmark': landmark,
      'city': city,
      'state': state,
      'pincode': pinCode,
      'is_default': isDefault,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}
