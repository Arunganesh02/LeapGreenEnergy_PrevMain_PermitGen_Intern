import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system'; // Use expo-file-system for file operations

// Function to convert image file to base64 using expo-file-system
const getImageBase64 = async (imagePath) => {
  try {
    // Read file as base64 using expo-file-system
    const base64Image = await FileSystem.readAsStringAsync(imagePath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64Image}`; // Use correct MIME type
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return ''; // Return empty string if error occurs
  }
};

export const generatePDF = async () => {
  try {
    // Fetch data from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(allKeys);

    let tableRows = ''; // To store dynamic rows
    let permitTable = ''; // Table for Permit Data
    let permitIdRow = ''; // Row for Permit ID

    // Iterate through the items and process only relevant data (checklist items)
    for (const [key, value] of items) {
      if (!key.endsWith('_complete') && key !== 'permitToWorkForm' && key !== 'selectedPermitData' && key !== 'selectedPermitId') {
        const parsedItems = JSON.parse(value);

        // Add the section row
        tableRows += `
          <tr>
            <td><b>${key}<b></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td> <!-- Empty column for images -->
          </tr>
        `;
        console.log(parsedItems)
        // Add the checklist items inside the section
        for (const [itemIndex, item] of parsedItems.entries()) {
          const image = item.imageUri; // Retrieve the image URL or path
          let imageBase64 = '';

          // If the item has an image and it's a local file, convert it to base64
          if (image) {
            imageBase64 = await getImageBase64(image); // Convert image to base64
          }

          tableRows += `
            <tr>
              <td>${itemIndex + 1}</td>
              <td><b><strong>${item.title}<strong><b></td>
              <td>${item.status || ''}</td>
              <td>${item.remarks || ''}</td>
              <td>${item.updatedRemarks || ''}</td>
              <td>${imageBase64 ? `<img src="${imageBase64}" alt="Image" style="width: 50px; height: 50px;">` : ''}</td> <!-- Display image if available -->
            </tr>
          `;
        }
      }

      // Handling 'selectedPermitData'
      if (key === 'selectedPermitData') {
        const parsed = JSON.parse(value);
        const engineers = parsed.engineers
          .map((engineer, index) => `${index + 1}. ${engineer.name}`)
          .join('<br>');
        
        permitTable += `
          <tr>
            <td>Location</td>
            <td>${parsed.location}</td>
          </tr>
          <tr>
            <td>Number of Persons</td>
            <td>${parsed.numberOfPersons}</td>
          </tr>
          <tr>
            <td>Description of Work</td>
            <td>${parsed.descriptionOfWork}</td>
          </tr>
          <tr>
            <td>Windspeed</td>
            <td>${parsed.windspeed}</td>
          </tr>
          <tr>
            <td>Model</td>
            <td>${parsed.model}</td>
          </tr>
          <tr>
            <td>Engineers</td>
            <td>${engineers}</td>
          </tr>
          <tr>
            <td>Work Area</td>
            <td>${parsed.workArea}</td>
          </tr>
        `;
      }

      // Handling 'selectedPermitId'
      if (key === 'selectedPermitId') {
        permitIdRow = `
          <tr>
            <td>Permit ID</td>
            <td>${value}</td>
          </tr>
        `;
      }
    }

    // Update the HTML template with the dynamic data
    const htmlContent = `
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Scheduled Maintenance Checklist - Nacelle</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
              }
              h1 {
                  color: #333;
                  text-align: center;
              }
              h2 {
                  color: #333;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
              }
              table, th, td {
                  border: 1px solid #ccc;
              }
              th, td {
                  padding: 8px;
                  text-align: left;
              }
              th {
                  background-color: #f4f4f4;
              }
              img {
                  width: 50px;
                  height: 50px;
              }
          </style>
      </head>
      <body>
          <h1>Scheduled Maintenance Report</h1>
          <hr>
          <h2>Permit Details</h2>
          <table>
              ${permitIdRow}
              ${permitTable}
          </table>
          <hr>
          <h2>Scheduled Maintenance Checklist</h2>
          <table>
              <tr>
                  <th>SR. NO.</th>
                  <th>CHECK POINT DETAILS</th>
                  <th>STATUS</th>
                  <th>REMARKS</th>
                  <th>UPDATED REMARKS</th>
                  <th>IMAGE</th> <!-- New image column -->
              </tr>
              ${tableRows}
          </table>


      </body>
      </html>
    `;

    // Return the generated HTML content
    return htmlContent;
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};
