import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ImageBackground } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './api/firebase';
import { Picker } from '@react-native-picker/picker';

const formatDateTime = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('th-TH', options);
};

const formatTime = (date) => {
  const options = { hour: '2-digit', minute: '2-digit' };
  return date.toLocaleTimeString('th-TH', options);
};

const TransferScreen = ({ route }) => {
  const { userId } = route.params;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [transferDate, setTransferDate] = useState(new Date());
  const [transferTime, setTransferTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [additionalNote, setAdditionalNote] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [image, setImage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (idCardNumber) {
      fetchInvoices();
      fetchPaymentHistory();
    }
  }, [idCardNumber]);

  const fetchUserData = async () => {
    try {
      const userDocRef = doc(db, "item", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setIdCardNumber(userData.idCardNumber || '');
      } else {
        Toast.show({
          type: 'error',
          text1: 'ไม่พบข้อมูล',
          text2: 'ไม่พบข้อมูลผู้ใช้',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
      });
    }
  };

  const fetchInvoices = async () => {
    try {
      const q = query(
        collection(db, 'invoice'),
        where('idCardNumber', '==', idCardNumber),
        where('status', 'in', ['ค้างชำระ', 'ชำระไม่สำเร็จ'])
      );
      const querySnapshot = await getDocs(q);
      let invoiceData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const monthOrder = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
      invoiceData.sort((a, b) => {
        const yearA = new Date(a.year, monthOrder.indexOf(a.month), 1).getFullYear();
        const yearB = new Date(b.year, monthOrder.indexOf(a.month), 1).getFullYear();

        if (yearA !== yearB) {
          return yearA - yearB;
        }

        const monthA = monthOrder.indexOf(a.month);
        const monthB = monthOrder.indexOf(b.month);
        return monthA - monthB;
      });

      setInvoices(invoiceData);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการดึงข้อมูลบิล',
      });
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const q = query(collection(db, 'payment'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      let paymentData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      paymentData.sort((a, b) => {
        const dateA = new Date(a.transferDate);
        const dateB = new Date(b.transferDate);
        return dateB - dateA;
      });

      setPaymentHistory(paymentData);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการดึงประวัติการโอนเงิน',
      });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'กรุณาอนุญาตการเข้าถึงรูปภาพเพื่อให้แอปทำงานได้',
      });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `images/${new Date().getTime()}.jpg`);

    try {
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image: ', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!selectedInvoice) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'กรุณาเลือกบิลที่ต้องการชำระ',
      });
      return;
    }

    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      // เพิ่มการเก็บข้อมูล garbagerate, month, และ year ลงใน payment
      await addDoc(collection(db, 'payment'), {
        userId,
        firstName,
        lastName,
        idCardNumber,
        transferDate: transferDate.toISOString(),
        transferTime: transferTime.toISOString(),
        additionalNote,
        file: imageUrl,
        invoiceNumber: selectedInvoice.invoiceNumber,
        garbagerate: selectedInvoice.garbagerate, // เก็บ garbagerate
        month: selectedInvoice.month, // เก็บ month
        year: selectedInvoice.year, // เก็บ year
        status: 'รอตรวจสอบ',
        createdAt: new Date().toISOString(),
      });

      Toast.show({
        type: 'success',
        text1: 'สำเร็จ',
        text2: 'การแจ้งโอนเงินสำเร็จ',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });

      setSelectedInvoice(null);
      setImage(null);
      setAdditionalNote('');
      setTransferDate(new Date());
      setTransferTime(new Date());

      fetchPaymentHistory();
      fetchInvoices();

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการแจ้งโอนเงิน',
      });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || transferDate;
    setShowDatePicker(false);
    setTransferDate(currentDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || transferTime;
    setShowTimePicker(false);
    setTransferTime(currentTime);
  };

  const showConfirmation = () => {
    Alert.alert(
      "ยืนยันการแจ้งโอนเงิน",
      "คุณต้องการแจ้งโอนเงินใช่ไหม?",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ยืนยัน",
          onPress: handleSubmit,
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ImageBackground
      source={require('../assets/images/screenmain.png')} // เพิ่มพื้นหลัง
      style={styles.container}
    >
      <Text style={styles.title}>ยืนยันการชำระเงิน</Text>

      <View style={styles.inputContainer}>
        <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
        <TextInput style={styles.input} value={firstName} editable={false} placeholder="ชื่อจริง" />
      </View>
      <View style={styles.inputContainer}>
        <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
        <TextInput style={styles.input} value={lastName} editable={false} placeholder="นามสกุล" />
      </View>
      <View style={styles.inputContainer}>
        <FontAwesome name="id-card" size={20} color="#333" style={styles.icon} />
        <TextInput style={styles.input} value={idCardNumber} editable={false} placeholder="เลขบัตรประชาชน" />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="file" size={20} color="#333" style={styles.icon} />
        {image ? (
          <View style={styles.imageSelectedContainer}>
            <Text style={styles.imageSelectedText}>
              ไฟล์ที่แนบแล้ว: {image.split('/').pop()}
            </Text>
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
              <FontAwesome name="times-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Text style={styles.imagePickerText}>เลือกไฟล์</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="calendar" size={20} color="#333" style={styles.icon} />
        <Picker
          selectedValue={selectedInvoice}
          style={styles.input}
          onValueChange={(itemValue) => setSelectedInvoice(itemValue)}
        >
          <Picker.Item label="เลือกเดือนที่ต้องการชำระ" value={null} />
          {invoices.map((invoice) => (
            <Picker.Item 
              key={invoice.id} 
              label={`เดือน: ${invoice.month} - ค่าขยะ: ${invoice.garbagerate} บาท`} 
              value={invoice} 
            />
          ))}
        </Picker>
      </View>

      <View style={styles.row}>
        <View style={styles.inputContainerHalf}>
          <Text style={styles.label}>วัน/เดือน/ปี ที่โอน</Text>
          <TouchableOpacity style={styles.inputField} onPress={() => setShowDatePicker(true)}>
            <FontAwesome name="calendar" size={20} color="#333" style={styles.icon} />
            <Text>{formatDateTime(transferDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={transferDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>
        <View style={styles.inputContainerHalf}>
          <Text style={styles.label}>เวลาที่โอน</Text>
          <TouchableOpacity style={styles.inputField} onPress={() => setShowTimePicker(true)}>
            <FontAwesome name="clock-o" size={24} color="black" />
            <Text>{formatTime(transferTime)}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={transferTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="pencil" size={20} color="#333" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={additionalNote}
          onChangeText={setAdditionalNote}
          multiline={true}
          numberOfLines={1}
          placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={showConfirmation}>
        <FontAwesome name="check" size={24} color="white" style={styles.icon} />
        <Text style={styles.submitButtonText}>แจ้งโอนเงิน</Text>
      </TouchableOpacity>

      <ScrollView style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>ประวัติการโอนเงิน</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>รายละเอียด</Text>
          <Text style={styles.tableHeaderText}>สถานะ</Text>
        </View>
        {paymentHistory.length > 0 ? paymentHistory.map((payment, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableText}>
              ชำระเงินวันที่ {formatDateTime(new Date(payment.transferDate))}
            </Text>
            <View style={[
              styles.statusContainer, 
              payment.status === 'ชำระแล้ว' ? styles.paid : 
              payment.status === 'ชำระไม่สำเร็จ' ? styles.failed : 
              styles.pending]}>
              <Text style={styles.statusText}>{payment.status}</Text>
            </View>
          </View>
        )) : (
          <Text>ยังไม่มีประวัติการโอนเงิน</Text>
        )}
      </ScrollView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#787373',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 15,
  },
  inputContainerHalf: {
    flex: 0.48,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  historyContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#4a4848',
    padding: 10,
    borderRadius: 10,
  },
  tableHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  tableText: {
    fontSize: 16,
    color: '#333',
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  paid: {
    backgroundColor: '#00c853',
  },
  pending: {
    backgroundColor: '#ffab00',
  },
  failed: {
    backgroundColor: '#ff5252',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  imagePickerButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
  },
  imagePickerText: {
    color: '#fff',
    fontSize: 16,
  },
  imageSelectedContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    width: '90%',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  imageSelectedText: {
    color: '#007bff',
    fontSize: 14,
  },
  removeImageButton: {
    marginLeft: 10,
  },
});

export default TransferScreen;
