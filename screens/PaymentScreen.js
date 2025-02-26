import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Image, ActivityIndicator, Animated, Alert, RefreshControl, ImageBackground } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './api/firebase'; // ตรวจสอบเส้นทางให้ถูกต้อง

const PaymentScreen = ({ route }) => {
  const { userId } = route.params;
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idCardNumber, setIdCardNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchUserAndInvoices = async () => {
      try {
        const userDocRef = doc(db, 'item', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userIdCardNumber = userData.idCardNumber;

          setIdCardNumber(userIdCardNumber);

          // ดึงบิลทั้งหมดที่เกี่ยวข้องกับผู้ใช้
          const invoiceQuery = query(
            collection(db, 'invoice'),
            where('idCardNumber', '==', userIdCardNumber)
          );

          const querySnapshot = await getDocs(invoiceQuery);
          let invoiceData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // เรียงลำดับบิลตามปี (พ.ศ.) และเดือน (มกราคม -> ธันวาคม, โดยให้มกราคมอยู่ล่างสุด)
          const monthOrder = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
          invoiceData.sort((a, b) => {
            const yearA = parseInt(a.year, 10);
            const yearB = parseInt(b.year, 10);

            if (yearA !== yearB) {
              return yearA - yearB; // ปีเก่าที่สุดอยู่ล่างสุด
            }

            const monthA = monthOrder.indexOf(a.month);
            const monthB = monthOrder.indexOf(b.month);
            return monthA - monthB; // เดือนเก่าที่สุดอยู่ล่างสุด
          });

          setInvoices(invoiceData);
        } else {
          alert('ไม่พบข้อมูลผู้ใช้');
        }
      } catch (error) {
        console.error('Error fetching invoices: ', error);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndInvoices();

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [userId]);

  const handleSaveImage = async () => {
    Alert.alert(
      'ยืนยันการบันทึก',
      'คุณต้องการบันทึก QR code หรือไม่?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'บันทึก',
          onPress: async () => {
            try {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('การอนุญาตถูกปฏิเสธ', 'กรุณาให้สิทธิ์การเข้าถึงคลังภาพ');
                return;
              }
  
              const assetSource = Image.resolveAssetSource(require('../assets/images/QRcodePayment.png'));
  
              const fileUri = `${FileSystem.documentDirectory}QRcodePayment.png`;
              await FileSystem.downloadAsync(assetSource.uri, fileUri);
  
              await MediaLibrary.saveToLibraryAsync(fileUri);
  
              Alert.alert('สำเร็จ', 'บันทึกรูปภาพเรียบร้อยแล้ว');
            } catch (error) {
              console.error('Error saving image: ', error);
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกรูปภาพได้');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserAndInvoices();
    setRefreshing(false);
  };

  const totalAmountDue = invoices
    .filter(invoice => invoice.status === 'ค้างชำระ')
    .reduce((total, invoice) => total + parseFloat(invoice.garbagerate || 0), 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00c853" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../assets/images/screenmain.png')}  // ภาพพื้นหลัง
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.totalPaymentContainer}>
          <Text style={styles.totalText}>ยอดค้างชำระทั้งหมด</Text>
          <Text style={styles.totalAmountText}>
            {totalAmountDue.toFixed(2)} บาท
          </Text>
          <Text style={styles.dueDateText}>
            ครบกำหนดทุกวันที่ 5 ของเดือน
          </Text>
        </View>

        {invoices
          .filter(invoice => invoice.status === 'ค้างชำระ')
          .map(invoice => (
            <View key={invoice.id} style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentDescription}>
                  ค่าขยะประจำเดือน {invoice.month}/{invoice.year}
                </Text>
                <Text style={styles.paymentDueDate}>ครบกำหนดทุกวันที่ 5 ของเดือน</Text>
              </View>
              <Text style={styles.paymentAmount}>{invoice.garbagerate} บาท</Text>
            </View>
          ))}

        <TouchableOpacity style={styles.payButton} onPress={() => setModalVisible(true)}>
          <FontAwesome name="qrcode" size={24} color="white" style={styles.qrIcon} />
          <Text style={styles.payButtonText}>ชำระด้วย QR Code</Text>
        </TouchableOpacity>

        {/* แสดงประวัติการชำระเงิน */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>ประวัติการชำระเงิน</Text>
          {invoices
            .filter(invoice => invoice.status === 'ชำระแล้ว')
            .map(invoice => (
              <View key={invoice.id} style={styles.historyRow}>
                <Text style={styles.historyText}>
                  บิลเดือน {invoice.month}/{invoice.year}
                </Text>
                <Text style={styles.historyAmountText}>
                  ยอดที่ชำระ: {invoice.amountPaid || invoice.garbagerate} บาท
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>

      {/* Modal สำหรับ QR Code */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>QR Code ของคุณพร้อมแล้ว</Text>
            <Image
              source={require('../assets/images/QRcodePayment.png')}
              style={styles.qrImage}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>แชร์ QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveImage}>
                <Text style={styles.saveButtonText}>บันทึก QR</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <Animated.Text style={[styles.noteText, { opacity: fadeAnim }]}>โปรดชำระทีละเดือน</Animated.Text>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingVertical: 20,
  },
  totalPaymentContainer: {
    backgroundColor: '#323538',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalText: {
    fontSize: 18,
    color: '#fff',
  },
  totalAmountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  dueDateText: {
    fontSize: 14,
    color: '#fff',
  },
  paymentRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: 16,
    color: '#333',
  },
  paymentDueDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 17,
    color: '#d62418',
  },
  noInvoicesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  payButton: {
    backgroundColor: '#00c853',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  qrIcon: {
    marginRight: 10,
  },
  payButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  historyContainer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopColor: '#dcdcdc',
    borderTopWidth: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  historyText: {
    fontSize: 14,
    color: '#666',
  },
  historyAmountText: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#21ab09',
  },
  qrImage: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  shareButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 5,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  divider: {
    borderBottomColor: '#dcdcdc',
    borderBottomWidth: 1,
    width: '100%',
    marginVertical: 5,
  },
  noteText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 5,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 105,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default PaymentScreen;
