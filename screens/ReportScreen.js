import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ImageBackground } from 'react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { db, storage } from './api/firebase'; 
import { Picker } from '@react-native-picker/picker';

const ReportScreen = ({ route }) => {
  const { userId } = route.params;
  const [firstName, setFirstName] = useState('');
  const [selectedReportTitle, setSelectedReportTitle] = useState(null);
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [image, setImage] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);

  const fetchUserData = async () => {
    try {
      const userDocRef = doc(db, "item", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setFirstName(userData.firstName  || '');
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

  const fetchReportHistory = async () => {
    try {
      const reportQuery = query(collection(db, 'Report'), where('userId', '==', userId));
      const querySnapshot = await getDocs(reportQuery);
      const history = querySnapshot.docs.map(doc => doc.data());
      setReportHistory(history);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการดึงประวัติการส่งเรื่องร้องเรียน',
      });
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchReportHistory();
  }, [userId]);

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
    const storageRef = ref(storage, `Report/${new Date().getTime()}.jpg`);

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
    if (!selectedReportTitle) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'กรุณาเลือกหัวข้อรายงาน',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
      return;
    }
    
    if (!location) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'กรุณาระบุสถานที่',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
      return;
    }
    
    if (!details) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'กรุณากรอกรายละเอียด',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
      return;
    }
  
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }
  
      await addDoc(collection(db, 'Report'), {
        userId,
        firstName,
        reportTitle: selectedReportTitle,
        location,
        details,
        file: imageUrl || null,
        status: 'รอตรวจสอบ',
        createdAt: new Date().toISOString(),
      });
  
      Toast.show({
        type: 'success',
        text1: 'สำเร็จ',
        text2: 'การส่งเรื่องร้องเรียนสำเร็จ',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
  
      setSelectedReportTitle(null);
      setLocation('');
      setDetails('');
      setImage(null);
  
      setReportHistory([...reportHistory, {
        reportTitle: selectedReportTitle,
        location,
        details,
        status: 'รอตรวจสอบ'
      }]);
  
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการส่งเรื่องร้องเรียน',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
    }
  };

  const showConfirmation = () => {
    Alert.alert(
      "ยืนยันการส่งเรื่องร้องเรียน",
      "คุณต้องการส่งเรื่องร้องเรียนใช่ไหม?",
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
      <Text style={styles.title}>แจ้งเรื่องร้องเรียน</Text>
      <View style={styles.inputContainer}>
        <Picker
          selectedValue={selectedReportTitle}
          style={styles.input}
          onValueChange={(itemValue) => setSelectedReportTitle(itemValue)}
        >
          <Picker.Item label="หัวเรื่องรายงาน" value={null} />
          <Picker.Item label="1. พนักงานไม่สุภาพ" value="พนักงานไม่สุภาพ" />
          <Picker.Item label="2. พนักงานไม่มาเก็บขยะ" value="พนักงานไม่มาเก็บขยะ" />
          <Picker.Item label="3. พนักงานทำความสะอาดไม่เรียบร้อย" value="พนักงานทำความสะอาดไม่เรียบร้อย" />
          <Picker.Item label="4. แอปพลิเคชันไม่สามารถเลือกเดือนที่ชำระได้" value="แอปพลิเคชันไม่สามารถเลือกเดือนที่ชำระได้" />
          <Picker.Item label="5. แอปพลิเคชันไม่สามารถเพิ่มใบเสร็จการชำระได้" value="แอปพลิเคชันไม่สามารถเพิ่มใบเสร็จการชำระได้" />
        </Picker>
      </View>

      <View style={styles.inputContainer}>
    <FontAwesome name="id-card" size={20} color="#333" style={styles.icon} />
    <TextInput style={styles.input} value={firstName} editable={false} placeholder="ชื่อ" />
    </View>


      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="ระบุสถานที่"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="รายละเอียด"
          value={details}
          onChangeText={setDetails}
          multiline
        />
      </View>

      <View style={styles.inputContainer}>
        {image ? (
          <View style={styles.imageSelectedContainer}>
            <Text style={styles.imageSelectedText}>
              ไฟล์ที่แนบแล้ว: {image.split('/').pop()}
            </Text>
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
              <FontAwesome name="times-circle" size={20} color="#ff0000" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <FontAwesome name="image" size={20} color="#fff" />
            <Text style={styles.imagePickerText}>แนบไฟล์รูป</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={showConfirmation}>
        <Text style={styles.submitButtonText}>ส่งเรื่องร้องเรียน</Text>
      </TouchableOpacity>

      <ScrollView style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>ประวัติการส่งเรื่องร้องเรียน</Text>
        {reportHistory.length > 0 ? reportHistory.map((report, index) => (
          <View key={index} style={styles.historyRow}>
            <Text>เหตุผล: {report.reportTitle}</Text>
            <Text>สถานที่: {report.location}</Text>
            <Text>รายละเอียด: {report.details}</Text>
            <Text style={[styles.statusText, 
              report.status === 'รอตรวจสอบ' ? styles.statusPending : 
              report.status === 'รับเรื่องร้องเรียน' ? styles.statusReceived : 
              report.status === 'ดำเนินการแก้ไขแล้ว' ? styles.statusResolved : null]}>
              สถานะ: {report.status}
            </Text>
          </View>
        )) : (
          <Text>ขณะนี้ไม่มีการร้องเรียนในประวัติ</Text>
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  icon: {
    marginRight: 10,
  },
  imagePickerButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 126,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  imagePickerText: {
    color: '#fff',
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
  historyRow: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  statusText: {
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#ffab00',
  },
  statusReceived: {
    color: '#ff8c00',
  },
  statusResolved: {
    color: '#008000',
  },
  imageText: {
    marginTop: 10,
    fontSize: 14,
    color: '#555',
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

export default ReportScreen;
