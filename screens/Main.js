import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Modal, Dimensions, FlatList, ImageBackground } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './api/firebase';

const screenWidth = Dimensions.get('window').width;

const Main = ({ route, navigation }) => {
  const { user } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [hasPendingInvoices, setHasPendingInvoices] = useState(false);
  const [newsImages, setNewsImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const flatListRef = useRef();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const q = query(collection(db, 'invoice'), where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);
        const invoiceData = querySnapshot.docs.map(doc => doc.data());
        setInvoices(invoiceData);

        const pendingInvoices = invoiceData.some(invoice => invoice.status === 'pending');
        setHasPendingInvoices(pendingInvoices);
      } catch (error) {
        console.error("Error fetching invoices: ", error);
      }
    };

    fetchInvoices();
  }, [user.id]);

  useEffect(() => {
    const fetchNewsImages = async () => {
      try {
        const announcementsRef = collection(db, 'announcements');
        const snapshot = await getDocs(announcementsRef);
        const images = snapshot.docs.map(doc => doc.data().image);
        setNewsImages(images);
      } catch (error) {
        console.error("Error fetching news images: ", error);
      }
    };

    fetchNewsImages();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (newsImages.length > 0) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % newsImages.length);
        flatListRef.current?.scrollToIndex({ animated: true, index: (currentIndex + 1) % newsImages.length });
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [currentIndex, newsImages]);

  const handleLogout = () => {
    setModalVisible(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );

    Toast.show({
      type: 'success',
      text1: 'ออกจากระบบสำเร็จ',
      text2: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
    });
  };

  return (
    <ImageBackground 
      source={require('../assets/images/screenmain.png')}  // ภาพพื้นหลัง
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image source={require('../assets/images/man.png')} style={styles.userIcon} />
        </TouchableOpacity>
        <Text style={styles.userName}>{user.firstName}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NotificationScreen')}>
          {/* ปุ่มแจ้งเตือนหรืออื่น ๆ */}
        </TouchableOpacity>
      </View>

      {/* Modal สำหรับการตั้งค่า */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>ตั้งค่า</Text>
            <Image source={require('../assets/images/man.png')} style={styles.modalUserIcon} />
            <Text style={styles.modalUserName}>{user.firstName} {user.lastName}</Text>
            <TouchableOpacity style={[styles.modalButton, styles.reportButton]}>
              <Text style={styles.modalButtonText}>แจ้งปัญหา</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.logoutButton]} onPress={handleLogout}>
              <Text style={styles.modalButtonText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="กำลังหาอะไรอยู่?" />
      </View>

      {/* หมวดหมู่ Title */}
      <Text style={styles.categoryTitle}>หมวดหมู่</Text>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <TouchableOpacity style={styles.category} onPress={() => navigation.navigate('ProfileScreen', { userId: user.id })}>
          <Image source={require('../assets/images/profile.png')} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>ข้อมูลส่วนตัว</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.category} onPress={() => navigation.navigate('PaymentScreen', { userId: user.id })}>
          <Image source={require('../assets/images/transaction-history.png')} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>ข้อมูลการชำระ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.category} onPress={() => navigation.navigate('TransferScreen', { userId: user.id })}>
          <Image source={require('../assets/images/cashless-payment.png')} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>แจ้งโอนเงิน</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.category} onPress={() => navigation.navigate('ReportScreen', { userId: user.id })}>
          <Image source={require('../assets/images/exclamation.png')} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>แจ้งเรื่องร้องเรียน</Text>
        </TouchableOpacity>
      </View>

      {/* News Section */}
      <View style={styles.newsContainer}>
        <Text style={styles.sectionTitle}>ข้อมูลข่าวสาร</Text>
        <FlatList
          ref={flatListRef}
          horizontal
          data={newsImages}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.newsImage} />
          )}
          keyExtractor={(item, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 40));
            setCurrentIndex(index);
          }}
        />

        {/* จุดแสดงสถานะของรูปภาพ */}
        <View style={styles.paginationContainer}>
          {newsImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex ? styles.activePaginationDot : null,
              ]}
            />
          ))}
        </View>
      </View>

      <Toast ref={(ref) => Toast.setRef(ref)} />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6200ee',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    color: '#fff',
    marginLeft: 10,
  },
  searchContainer: {
    marginTop: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  category: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  newsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  newsImage: {
    width: screenWidth - 40,
    height: (screenWidth - 10) * 0.56,
    borderRadius: 10,
    marginRight: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 10,
    height: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activePaginationDot: {
    backgroundColor: '#6200ee',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    position: 'absolute',
    top: 90,
    width: 250,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    left: 90,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalUserIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  reportButton: {
    backgroundColor: '#ffeb3b',
  },
  logoutButton: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Main;
