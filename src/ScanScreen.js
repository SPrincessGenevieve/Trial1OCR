import React, { useEffect, useState, useRef } from "react";
import {     View, TouchableOpacity, StyleSheet, Alert, Image, Text } from "react-native";
import { Camera, CameraType, requestCameraPermissionsAsync, getCameraPermissionsAsync} from "expo-camera";
import Feather from "@expo/vector-icons/Feather";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from "@react-navigation/native";
import ConstButtonShort from "./ConstButtonShort";
import stringSimilarity from 'string-similarity';


export default function ScanScreen({title, style}) {
    const [cameraMode, setCameraMode] = useState(CameraType.back);
    const [flash, setFlash] = useState("off"); // Changed to string type
    const [pictureUri, setPictureUri] = useState("");
    const cameraRef = useRef();
    const [showPicture, setShowPicture] = useState(false); // New state variable to control showing the picture
    const navigation = useNavigation();


    useEffect(() => {
        requestPermission();
    }, []);    

    const requestPermission = async () => {
        await requestCameraPermissionsAsync();
    };    

    const getPermission = async () => {
        const cameraPermission = await getCameraPermissionsAsync();
        return cameraPermission.granted;
    };

    const takePicture = async () => {
      const { uri, width, height } = await cameraRef?.current.takePictureAsync();
    
      // Calculate the dimensions for cropping (adjust these values according to your needs)
      const cropWidth = 2500;
      const cropHeight = 1450;
      const left = 270;
      const top = 1300;

      try {
        // Crop the image with specified dimensions
        const croppedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ crop: { originX: left, originY: top, width: cropWidth, height: cropHeight } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG } // Adjust the compression quality here (0.8 means 80% quality)
        );

        // Set the cropped image URI
        setPictureUri(croppedImage.uri);
        setShowPicture(true);
      } catch (error) {
        console.log("Error cropping the image:", error);
        // Handle the error here
      }
    
    };    


    const cancelPicture = () => {
        // Remove the displayed picture and go back to the camera preview
        setPictureUri("");
        setShowPicture(false);
      };    

      const handleNextButton = async () => {
        try {
          if (!pictureUri) {
            Alert.alert("Please take a picture first.");
            return;
          }
          
          const apiKey = 'K82216846188957';
          const apiUrl = 'https://api.ocr.space/parse/image';
          const formData = new FormData();
          formData.append('apikey', apiKey);
          formData.append('language', 'eng');
          formData.append('isOverlayRequired', 'false');
          formData.append('file', { uri: pictureUri, name: 'image.jpg', type: 'image/jpeg' });
          formData.append('OCREngine', '2');
          const response = await axios.post(apiUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
            
          if (response?.data?.ParsedResults?.length > 0) {
            const extractedText = response.data.ParsedResults[0]?.ParsedText || "";
      
            // Define field mappings
            const fieldMappings = {
              "Name": "Last Name, First Name, Middle Name",
              "Nationality": "Nationality",
              "Sex": "Sex",
              "Date of Birth": "Date of Birth",
              "Weight": "Weight (kg)",
              "Height": "Height(m)",
              "Address": "Address",
              "License No.": "License No",
              "Expiration Date": "Expiration Date",
              "Agency Code": "Agency Code",
              "Blood Type": "Blood Type",
              "Eyes Color": "Eyes Color",
              "Restrictions": "Restrictions",
              "Conditions": "Conditions",
            };
      
            const extractedFields = {};
      
            // Split extracted text into lines
            const lines = extractedText.split(/\r?\n/);
      
            // Compare each line to field mappings and extract values
            for (const line of lines) {
              const normalizedLine = line.trim();
              for (const [fieldLabel, fieldKeywords] of Object.entries(fieldMappings)) {
                const keywords = fieldKeywords.toLowerCase().split(', ');
                for (const keyword of keywords) {
                  const similarity = stringSimilarity.compareTwoStrings(keyword, normalizedLine.toLowerCase());
                  if (similarity > 0.5) {
                    extractedFields[fieldLabel] = normalizedLine;
                    console.log(`Matched: ${fieldLabel} (${keyword}) - ${normalizedLine} (Similarity: ${similarity})`);
                    break;
                  }
                }
              }
            }
      
            Alert.alert("Extracted Texts", JSON.stringify(extractedFields, null, 2));
            console.log("Extracted Texts:", extractedFields);
          } else {
            Alert.alert("Text extraction failed. Please try again later.");
          }
        } catch (error) {
          console.log("Error extracting text:", error);
          Alert.alert("Error extracting text. Please try again later.");
        }
      };
      

    if (!getPermission()) {
        return Alert.alert(
            "Permission Required!",
            "You need to provide the permissions to access the camera",
            [{ text: "Got it" }]
        );
    }

    const switchFlashMode = () => {
        setFlash(flash === "off" ? "on" : "off");
    };

    const pickImage = async () => {

      let result =  await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })

      console.log(result);
      if (!result.canceled) {
        setPictureUri(result.assets[0].uri);
        setShowPicture(true)
      }

    }

   



  return(
        <View style={styles.container}>
        {/* Show the camera preview or the captured picture */}
        {showPicture ? (
          <View style={styles.pictureContainer}>
            <Image style={styles.picture} source={{ uri: pictureUri }} />
            <View style={{height: 250, width: 300, position:"absolute", marginTop: 550, top: 1, justifyContent:"center", alignItems:"center", flexDirection:"row"}}>
                <ConstButtonShort onPress={cancelPicture} name="close" title="Cancel" backgroundColor="#C8B23D"></ConstButtonShort>
                <ConstButtonShort onPress={handleNextButton} name="check" title="Next" backgroundColor="#5F5DC5"></ConstButtonShort>
            </View>

          </View>
        ) : (
          <View style={styles.cameraContainer}>
          <Camera ref={cameraRef} style={styles.camera} type={cameraMode} flashMode={flash}>
            {/* Empty View for the Camera component */}
          </Camera>   
          <View style={styles.controlsContainer}>
            <Feather name="image" size={35} color="white" onPress={pickImage} />
            <TouchableOpacity style={styles.takePictureBtn} onPress={takePicture} />
            <Feather
              name={flash === "off" ? "zap-off" : "zap"}
              size={30}
              onPress={switchFlashMode}
              color="white"
            />
          </View>
        </View>
        )}
  
  {!showPicture && (
        <View style={style}>
          <Text style={styles.cardText}>{title}</Text>
        </View>
      )}
    </View>
  )




}

const styles = StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
    },
    cameraContainer: {
      flex: 1,
      position: "relative",
    },
    camera: {
      flex: 1,
    },
    controlsContainer: {
      backgroundColor: "rgba(57, 92, 219, 1)",
      flexDirection: "row",
      justifyContent: "space-evenly",
      alignItems: "center",
    },
    takePictureBtn: {
      backgroundColor: "#fff",
      borderRadius: 35,
      height: 70,
      width: 70,
      marginVertical: 10,
    },
    cardText: {
      color: "white",
      letterSpacing: 1.5,
      textAlign: "justify",
    },
    pictureContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    picture: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
    cancelBtn: {
      position: "absolute",
      bottom: 100,
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 10,
      right: 95,
    },
    cancelText: {
      color: "red",
      fontSize: 16,
    },
    nextBtn: {
      position: "absolute",
      bottom: 100,
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 10,
      paddingHorizontal: 20,
      left: 95
    },
    nextText: {
      color: "green",
      fontSize: 16,
    },
});
