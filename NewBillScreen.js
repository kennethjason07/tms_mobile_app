import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Switch,
  Modal,
} from 'react-native';

export default function NewBillScreen({ navigation }) {
  const [formData, setFormData] = useState({
    // Customer Info
    customerName: '',
    mobileNumber: '',
    mobileNumber2: '',
    orderNumber: '',
    orderNumber2: '',
    orderNumber3: '',
    
    // Dates
    todayDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    dateIssue: '',
    deliveryDate: '',
    
    // Measurements Selection
    pantSelected: false,
    shirtSelected: false,
    extraSelected: false,
    
    // Pant Measurements
    pantLength: '',
    pantKamar: '',
    pantHips: '',
    pantWaist: '',
    pantGhutna: '',
    pantBottom: '',
    pantSeat: '',
    pantDraw: '',
    sidePCross: '',
    plates: '',
    belt: '',
    backP: '',
    wp: '',
    
    // Shirt Measurements
    shirtLength: '',
    shirtBody: '',
    shirtLoose: '',
    shirtShoulder: '',
    shirtAstin: '',
    shirtCollar: '',
    shirtAloose: '',
    shirtDraw: '',
    callar: '',
    cuff: '',
    pkt: '',
    looseShirt: '',
    dtTt: '',
    
    // Extra Measurements
    extraInput: '',
    
    // Garment Types
    suitSelected: false,
    safariSelected: false,
    pantGarmentSelected: false,
    shirtGarmentSelected: false,
    sadriSelected: false,
    
    // Payment
    paymentMode: 'Cash',
    paymentStatus: 'pending',
    advanceAmount: '0',
    
    // Quantities and Amounts
    suitQty: '0',
    suitAmount: '0',
    safariQty: '0',
    safariAmount: '0',
    pantQty: '0',
    pantAmount: '0',
    shirtQty: '0',
    shirtAmount: '0',
    sadriQty: '0',
    sadriAmount: '0',
    totalQty: '0',
    totalAmount: '0',
  });

  const [showPantSection, setShowPantSection] = useState(false);
  const [showShirtSection, setShowShirtSection] = useState(false);
  const [showExtraSection, setShowExtraSection] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const paymentOptions = ['pending', 'paid', 'advance'];

  // Update measurement sections visibility
  useEffect(() => {
    setShowPantSection(formData.pantSelected);
    setShowShirtSection(formData.shirtSelected);
    setShowExtraSection(formData.extraSelected);
  }, [formData.pantSelected, formData.shirtSelected, formData.extraSelected]);

  // Calculate totals whenever quantities or amounts change
  useEffect(() => {
    const suitQty = parseFloat(formData.suitQty) || 0;
    const suitAmt = parseFloat(formData.suitAmount) || 0;
    const safariQty = parseFloat(formData.safariQty) || 0;
    const safariAmt = parseFloat(formData.safariAmount) || 0;
    const pantQty = parseFloat(formData.pantQty) || 0;
    const pantAmt = parseFloat(formData.pantAmount) || 0;
    const shirtQty = parseFloat(formData.shirtQty) || 0;
    const shirtAmt = parseFloat(formData.shirtAmount) || 0;
    const sadriQty = parseFloat(formData.sadriQty) || 0;
    const sadriAmt = parseFloat(formData.sadriAmount) || 0;

    const totalQty = suitQty + safariQty + pantQty + shirtQty + sadriQty;
    const totalAmt = suitAmt + safariAmt + pantAmt + shirtAmt + sadriAmt;

    setFormData(prev => ({
      ...prev,
      totalQty: totalQty.toString(),
      totalAmount: totalAmt.toFixed(2),
    }));
  }, [formData.suitQty, formData.suitAmount, formData.safariQty, formData.safariAmount, 
      formData.pantQty, formData.pantAmount, formData.shirtQty, formData.shirtAmount, 
      formData.sadriQty, formData.sadriAmount]);

  // Auto-fill dates
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      dateIssue: prev.todayDate,
      deliveryDate: prev.dueDate,
    }));
  }, [formData.todayDate, formData.dueDate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const searchCustomer = async () => {
    if (!formData.mobileNumber2 || formData.mobileNumber2.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/customer-info/${formData.mobileNumber2}`);
      if (!response.ok) {
        throw new Error('No data found for the provided mobile number.');
      }
      const data = await response.json();
      
      // Populate form with customer data
      setFormData(prev => ({
        ...prev,
        customerName: data.customer_name || '',
        mobileNumber: data.mobile_number || '',
        // Populate measurements if available
        pantLength: data.measurements?.pant_length || '',
        pantKamar: data.measurements?.pant_kamar || '',
        pantHips: data.measurements?.pant_hips || '',
        pantWaist: data.measurements?.pant_waist || '',
        pantGhutna: data.measurements?.pant_ghutna || '',
        pantBottom: data.measurements?.pant_bottom || '',
        pantSeat: data.measurements?.pant_seat || '',
        sidePCross: data.measurements?.SideP_Cross || '',
        plates: data.measurements?.Plates || '',
        belt: data.measurements?.Belt || '',
        backP: data.measurements?.Back_P || '',
        wp: data.measurements?.WP || '',
        shirtLength: data.measurements?.shirt_length || '',
        shirtBody: data.measurements?.shirt_body || '',
        shirtLoose: data.measurements?.shirt_loose || '',
        shirtShoulder: data.measurements?.shirt_shoulder || '',
        shirtAstin: data.measurements?.shirt_astin || '',
        shirtCollar: data.measurements?.shirt_collar || '',
        shirtAloose: data.measurements?.shirt_aloose || '',
        callar: data.measurements?.Callar || '',
        cuff: data.measurements?.Cuff || '',
        pkt: data.measurements?.Pkt || '',
        looseShirt: data.measurements?.LooseShirt || '',
        dtTt: data.measurements?.DT_TT || '',
        extraInput: data.measurements?.extra_measurements || '',
      }));
    } catch (error) {
      console.error('Error fetching customer data:', error);
      Alert.alert('Error', 'Could not fetch customer data. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/new-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Bill created successfully');
        // Reset form or navigate back
        navigation.goBack();
      } else {
        throw new Error('Failed to create bill');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      Alert.alert('Error', 'An error occurred while creating the bill.');
    }
  };

  const renderMeasurementField = (label, field, placeholder = '') => (
    <View style={styles.inputRow}>
      <Text style={styles.label}>{label}:</Text>
      <TextInput
        style={styles.textInput}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Bill</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.screenTitle}>New Bill</Text>

        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Customer</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Mobile Number"
              value={formData.mobileNumber2}
              onChangeText={(value) => handleInputChange('mobileNumber2', value)}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchCustomer}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Number */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          {renderMeasurementField('Order Number', 'orderNumber')}
        </View>

        {/* Measurement Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Measurement Type</Text>
          <View style={styles.checkboxRow}>
            <Switch
              value={formData.pantSelected}
              onValueChange={(value) => handleInputChange('pantSelected', value)}
            />
            <Text style={styles.checkboxLabel}>Pant</Text>
          </View>
          <View style={styles.checkboxRow}>
            <Switch
              value={formData.shirtSelected}
              onValueChange={(value) => handleInputChange('shirtSelected', value)}
            />
            <Text style={styles.checkboxLabel}>Shirt</Text>
          </View>
          <View style={styles.checkboxRow}>
            <Switch
              value={formData.extraSelected}
              onValueChange={(value) => handleInputChange('extraSelected', value)}
            />
            <Text style={styles.checkboxLabel}>Extra</Text>
          </View>
        </View>

        {/* Pant Measurements */}
        {showPantSection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pant Measurements</Text>
            {renderMeasurementField('Length', 'pantLength')}
            {renderMeasurementField('Kamar', 'pantKamar')}
            {renderMeasurementField('Hips', 'pantHips')}
            {renderMeasurementField('Waist', 'pantWaist')}
            {renderMeasurementField('Ghutna', 'pantGhutna')}
            {renderMeasurementField('Bottom', 'pantBottom')}
            {renderMeasurementField('Seat', 'pantSeat')}
            {renderMeasurementField('SideP/Cross', 'sidePCross')}
            {renderMeasurementField('Plates', 'plates')}
            {renderMeasurementField('Belt', 'belt')}
            {renderMeasurementField('Back P.', 'backP')}
            {renderMeasurementField('WP.', 'wp')}
            
            <Text style={styles.label}>Pant Drawing:</Text>
            <TextInput
              style={styles.textArea}
              value={formData.pantDraw}
              onChangeText={(value) => handleInputChange('pantDraw', value)}
              placeholder="Enter pant drawing details..."
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Shirt Measurements */}
        {showShirtSection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shirt Measurements</Text>
            {renderMeasurementField('Length', 'shirtLength')}
            {renderMeasurementField('Body', 'shirtBody')}
            {renderMeasurementField('Loose', 'shirtLoose')}
            {renderMeasurementField('Shoulder', 'shirtShoulder')}
            {renderMeasurementField('Astin', 'shirtAstin')}
            {renderMeasurementField('Collar', 'shirtCollar')}
            {renderMeasurementField('Aloose', 'shirtAloose')}
            {renderMeasurementField('Collar', 'callar')}
            {renderMeasurementField('Cuff', 'cuff')}
            {renderMeasurementField('Pkt.', 'pkt')}
            {renderMeasurementField('Loose', 'looseShirt')}
            {renderMeasurementField('DT/TT', 'dtTt')}
            
            <Text style={styles.label}>Shirt Drawing:</Text>
            <TextInput
              style={styles.textArea}
              value={formData.shirtDraw}
              onChangeText={(value) => handleInputChange('shirtDraw', value)}
              placeholder="Enter shirt drawing details..."
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Extra Measurements */}
        {showExtraSection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extra Measurements</Text>
            <TextInput
              style={styles.textArea}
              value={formData.extraInput}
              onChangeText={(value) => handleInputChange('extraInput', value)}
              placeholder="Enter extra measurements..."
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Garment Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Garment Type</Text>
          <View style={styles.checkboxRow}>
            <Switch
              value={formData.suitSelected}
              onValueChange={(value) => handleInputChange('suitSelected', value)}
            />
            <Text style={styles.checkboxLabel}>Suit</Text>
          </View>
          <View style={styles.checkboxRow}>
            <Switch
              value={formData.safariSelected}
              onValueChange={(value) => handleInputChange('safariSelected', value)}
            />
            <Text style={styles.checkboxLabel}>Safari/Jacket</Text>
          </View>
          <View style={styles.checkboxRow}>
            <Switch
              value={formData.pantGarmentSelected}
              onValueChange={(value) => handleInputChange('pantGarmentSelected', value)}
            />
            <Text style={styles.checkboxLabel}>Pant</Text>
          </View>
          <View style={styles.checkboxRow}>
            <Switch
              value={formData.shirtGarmentSelected}
              onValueChange={(value) => handleInputChange('shirtGarmentSelected', value)}
            />
            <Text style={styles.checkboxLabel}>Shirt</Text>
          </View>
          <View style={styles.checkboxRow}>
            <Switch
              value={formData.sadriSelected}
              onValueChange={(value) => handleInputChange('sadriSelected', value)}
            />
            <Text style={styles.checkboxLabel}>Sadri</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          {renderMeasurementField('Customer Name', 'customerName')}
          {renderMeasurementField('Mobile Number', 'mobileNumber')}
          {renderMeasurementField('Order Date', 'todayDate')}
          {renderMeasurementField('Delivery Date', 'dueDate')}
        </View>

        {/* Bill Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Particulars</Text>
              <Text style={styles.tableHeaderText}>Qty</Text>
              <Text style={styles.tableHeaderText}>Amount</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Suit</Text>
              <TextInput
                style={styles.tableInput}
                value={formData.suitQty}
                onChangeText={(value) => handleInputChange('suitQty', value)}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.tableInput}
                value={formData.suitAmount}
                onChangeText={(value) => handleInputChange('suitAmount', value)}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Safari/Jacket</Text>
              <TextInput
                style={styles.tableInput}
                value={formData.safariQty}
                onChangeText={(value) => handleInputChange('safariQty', value)}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.tableInput}
                value={formData.safariAmount}
                onChangeText={(value) => handleInputChange('safariAmount', value)}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Pant</Text>
              <TextInput
                style={styles.tableInput}
                value={formData.pantQty}
                onChangeText={(value) => handleInputChange('pantQty', value)}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.tableInput}
                value={formData.pantAmount}
                onChangeText={(value) => handleInputChange('pantAmount', value)}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Shirt</Text>
              <TextInput
                style={styles.tableInput}
                value={formData.shirtQty}
                onChangeText={(value) => handleInputChange('shirtQty', value)}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.tableInput}
                value={formData.shirtAmount}
                onChangeText={(value) => handleInputChange('shirtAmount', value)}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Sadri</Text>
              <TextInput
                style={styles.tableInput}
                value={formData.sadriQty}
                onChangeText={(value) => handleInputChange('sadriQty', value)}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.tableInput}
                value={formData.sadriAmount}
                onChangeText={(value) => handleInputChange('sadriAmount', value)}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.totalCell]}>Total</Text>
              <Text style={[styles.tableInput, styles.totalInput]}>{formData.totalQty}</Text>
              <Text style={[styles.tableInput, styles.totalInput]}>{formData.totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Payment Status:</Text>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => setShowPaymentModal(true)}
            >
              <Text style={styles.paymentButtonText}>{formData.paymentStatus}</Text>
            </TouchableOpacity>
          </View>
          
          {renderMeasurementField('Advance Amount', 'advanceAmount', '0')}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Save and Print</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal
          visible={showPaymentModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Payment Status</Text>
              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => {
                  handleInputChange('paymentStatus', 'pending');
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.paymentOptionText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => {
                  handleInputChange('paymentStatus', 'paid');
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.paymentOptionText}>Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => {
                  handleInputChange('paymentStatus', 'advance');
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.paymentOptionText}>Advance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
    resizeMode: 'contain',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  content: {
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2980b9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 100,
    fontSize: 14,
    color: '#34495e',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#34495e',
  },
  billTable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 8,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  tableInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    textAlign: 'center',
  },
  totalCell: {
    fontWeight: 'bold',
  },
  totalInput: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2980b9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  paymentOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 8,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  paymentButton: {
    backgroundColor: '#2980b9',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  placeholder: {
    flex: 1,
  },
}); 