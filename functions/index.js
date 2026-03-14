/**
 * Firebase Cloud Function: Calculate BMI on evaluation creation
 * 
 * Deploy with: firebase deploy --only functions
 * 
 * This function triggers when a new evaluation document is created.
 * It looks up the client's height and calculates BMI.
 * 
 * BMI = weight / (height * height)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.calculateBMI = functions.firestore
  .document("evaluations/{evaluationId}")
  .onCreate(async (snap, context) => {
    const evaluation = snap.data();
    const { clientId, weight } = evaluation;

    if (!clientId || !weight) {
      console.log("Missing clientId or weight, skipping BMI calculation");
      return null;
    }

    try {
      // Get client document for height
      const clientDoc = await db.collection("clients").doc(clientId).get();

      if (!clientDoc.exists) {
        console.log(`Client ${clientId} not found`);
        return null;
      }

      const client = clientDoc.data();
      const height = client.height; // in meters

      if (!height || height <= 0) {
        console.log("Invalid height, skipping BMI calculation");
        return null;
      }

      // Calculate BMI
      const bmi = parseFloat((weight / (height * height)).toFixed(1));

      // Update the evaluation document with BMI
      await snap.ref.update({ bmi });

      console.log(
        `BMI calculated for evaluation ${context.params.evaluationId}: ${bmi}`
      );

      return null;
    } catch (error) {
      console.error("Error calculating BMI:", error);
      return null;
    }
  });
