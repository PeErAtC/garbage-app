import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView, ImageBackground } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { FontAwesome } from '@expo/vector-icons'; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from './api/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ฟังก์ชันสำหรับการตัดข้อความ
const truncateText = (text, length = 30) => {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
};

const ProfileScreen = ({ route }) => {
  const { userId } = route.params;

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    idCardNumber: '',
    phoneNumber: '',
    houseNumber: '',
    moo: '',
    subDistrict: '',
    district: '',
    province: '',
    location: '',
    profileImage: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "item", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setError("ไม่พบข้อมูลผู้ใช้");
        }
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("ต้องการอนุญาต", "กรุณาอนุญาตการเข้าถึงแกลเลอรีเพื่อใช้งานฟีเจอร์นี้");
      return;
    }
  
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
  
    if (!pickerResult.cancelled && pickerResult.assets && pickerResult.assets.length > 0) {
      const { uri } = pickerResult.assets[0];
      if (uri) {
        await uploadImageToStorage(uri);
      } else {
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถดึง URI ของรูปภาพได้");
      }
    } else {
      Alert.alert("ยกเลิกการเลือกภาพ", "ไม่มีภาพที่ถูกเลือก");
    }
  };
  
  const uploadImageToStorage = async (uri) => {
    try {
      if (!uri) {
        throw new Error("URI ของรูปภาพเป็น null หรือไม่ถูกต้อง");
      }
  
      const storage = getStorage();
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profileImages/${userId}/profile_${Date.now()}.jpg`);
  
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
  
      // อัปเดต URL ของรูปภาพใน Firestore
      await updateDoc(doc(db, "item", userId), { profileImage: downloadURL });

      // อัปเดตสถานะของผู้ใช้ในหน้าจอ
      setUserData({ ...userData, profileImage: downloadURL });

      Toast.show({
        type: 'success',
        text1: 'สำเร็จ',
        text2: 'อัปโหลดรูปภาพสำเร็จ',
      });
    } catch (err) {
      console.error("Error uploading image: ", err);
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'ไม่สามารถอัปโหลดรูปภาพได้',
      });
    }
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, "item", userId);
      await updateDoc(docRef, { ...userData });

      Toast.show({
        type: 'success',
        text1: 'สำเร็จ',
        text2: 'บันทึกข้อมูลสำเร็จ',
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Error updating document: ", err);
      Toast.show({
        type: 'error',
        text1: 'ข้อผิดพลาด',
        text2: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../assets/images/screenmain.png')}  // ภาพพื้นหลัง
      style={styles.container}
    >
      <Text style={styles.title}>ข้อมูลส่วนตัว</Text>
      <TouchableOpacity onPress={handleImagePicker}>
        <Image 
          source={userData.profileImage ? { uri: userData.profileImage } : require('../assets/images/user.png')} 
          style={styles.profileImage} 
        />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isEditing ? (
          <>
            {/* ส่วนแก้ไขข้อมูล */}
            <View style={styles.detailRow}>
              <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                value={userData.firstName}
                onChangeText={(text) => setUserData({ ...userData, firstName: text })}
                placeholder="ชื่อ"
              />
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                value={userData.lastName}
                onChangeText={(text) => setUserData({ ...userData, lastName: text })}
                placeholder="นามสกุล"
              />
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="id-card" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                value={userData.idCardNumber}
                onChangeText={(text) => setUserData({ ...userData, idCardNumber: text })}
                placeholder="เลขบัตรประชาชน"
                keyboardType="numeric"
                maxLength={13}
              />
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="phone" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                value={userData.phoneNumber}
                onChangeText={(text) => setUserData({ ...userData, phoneNumber: text })}
                placeholder="เบอร์โทร"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="home" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                value={userData.houseNumber}
                onChangeText={(text) => setUserData({ ...userData, houseNumber: text })}
                placeholder="ที่อยู่บ้านเลขที่"
              />
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                value={userData.moo}
                onChangeText={(text) => setUserData({ ...userData, moo: text })}
                placeholder="หมู่ที่"
              />
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                value={userData.subDistrict}
                onChangeText={(text) => setUserData({ ...userData, subDistrict: text })}
                placeholder="ตำบล"
              />
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                value={userData.district}
                onChangeText={(text) => setUserData({ ...userData, district: text })}
                placeholder="อำเภอ"
              />
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                value={userData.province}
                onChangeText={(text) => setUserData({ ...userData, province: text })}
                placeholder="จังหวัด"
              />
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <TextInput
                style={[styles.inputField, styles.multilineField]} 
                value={userData.location}
                onChangeText={(text) => setUserData({ ...userData, location: text })}
                placeholder="Location"
                multiline
                numberOfLines={4}
              />
            </View>

          </>
        ) : (
          <>
            {/* ส่วนแสดงข้อมูล */}
            <View style={styles.detailRow}>
              <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>ชื่อ :</Text>
              <Text style={styles.value}>{truncateText(userData.firstName)}</Text>
            </View>
            <View style={styles.separator} />

            {/* ใส่ฟิลด์ข้อมูลที่เหลือ */}
            <View style={styles.detailRow}>
              <FontAwesome name="user" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>นามสกุล :</Text>
              <Text style={styles.value}>{truncateText(userData.lastName)}</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="id-card" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>เลขบัตรประชาชน :</Text>
              <Text style={styles.value}>{truncateText(userData.idCardNumber)}</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="phone" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>เบอร์โทร :</Text>
              <Text style={styles.value}>{truncateText(userData.phoneNumber)}</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="home" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>ที่อยู่บ้านเลขที่ :</Text>
              <Text style={styles.value}>{truncateText(userData.houseNumber)}</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>หมู่ที่ :</Text>
              <Text style={styles.value}>{truncateText(userData.moo)}</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>ตำบล :</Text>
              <Text style={styles.value}>{truncateText(userData.subDistrict)}</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>อำเภอ :</Text>
              <Text style={styles.value}>{truncateText(userData.district)}</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>จังหวัด :</Text>
              <Text style={styles.value}>{truncateText(userData.province)}</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={20} color="#333" style={styles.icon} />
              <Text style={styles.label}>Location :</Text>
              <Text style={styles.value}>{truncateText(userData.location)}</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.buttonText}>บันทึก</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => setIsEditing(true)}>
            <Text style={styles.buttonText}>แก้ไข</Text>
          </TouchableOpacity>
        )}
      </View>

      <Toast ref={(ref) => Toast.setRef(ref)} />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  scrollContainer: {
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%', // เพิ่ม width 100% เพื่อให้แถวเต็มพื้นที่
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  value: {
    color: '#007aff',
    fontSize: 16,
    marginLeft: 5,
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#007aff',  // เปลี่ยนสีตัวหนังสือเป็นสีน้ำเงิน
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  editButton: {
    backgroundColor: '#ffeb3b',
  },
  saveButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#000',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  multilineField: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default ProfileScreen;
