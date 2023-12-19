import type { Authentication } from "@canva/user";
import { auth } from "@canva/user";
import { Box, Button, Rows, Text } from "@canva/app-ui-kit";
import React, { useState } from "react";
import styles from "styles/components.css";
import UserUploads from "./UserUploads";
import { requestExport, ExportResponse } from "@canva/design";
type State = "authenticated" | "not_authenticated" | "checking" | "error";

/**
 * This endpoint is defined in the ./backend/server.ts file. You need to
 * register the endpoint in the Developer Portal before sending requests.
 *
 * BACKEND_HOST is configured in the root .env file, for more information,
 * refer to the README.md.
 */
const AUTHENTICATION_CHECK_URL = `${BACKEND_HOST}/api/authentication/status`;

const checkAuthenticationStatus = async (
  auth: Authentication
): Promise<State> => {
  /**
   * Send a request to an endpoint that checks if the user is authenticated.
   * This is a (very) rudimentary implementation.
   *
   * Note: You must register the provided endpoint via the Developer Portal.
   */
  try {
    const token = await auth.getCanvaUserToken();
    
    const res = await fetch(AUTHENTICATION_CHECK_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json', // Set the content type to JSON
      },
      method: "POST",
      body: JSON.stringify({ token })
    });
    const body = await res.json();

    if (body?.isAuthenticated) {
      return "authenticated";
    } else {
      return "not_authenticated";
    }
  } catch (error) {
    console.error(error);
    return "error";
  }
};

export const App = () => {
  // Keep track of the user's authentication status.
  const [state, setState] = React.useState<State>("checking");
  const [exportState, setExportState] = useState<"exporting" | "idle">("idle");
  const [exportResponse, setExportResponse] = useState<ExportResponse | undefined>();

  React.useEffect(() => {
    checkAuthenticationStatus(auth).then((status) => {
      setState(status);
    });
  }, []);

  const startAuthenticationFlow = async () => {
    // Start the authentication flow
    try {
      const response = await auth.requestAuthentication();
      switch (response.status) {
        case "COMPLETED":
          setState("authenticated");
          break;
        case "ABORTED":
          console.warn("Authentication aborted by user.");
          setState("not_authenticated");
          break;
        case "DENIED":
          console.warn("Authentication denied by user", response.details);
          setState("not_authenticated");
          break;
      }
    } catch (e) {
      console.error(e);
      setState("error");
    }
  };

  const exportDocument = async () => {
    if (exportState === "exporting") return;
    try {
      setExportState("exporting");

      const response = await requestExport({
        acceptedFileTypes: [
          "PNG",
          "PDF_STANDARD",
          "JPG",
          "GIF",
          //"SVG",
          "VIDEO",
          //"PPTX",
        ],
      });

      setExportResponse(response);
      
      // Assuming `response` contains the Canva blob data
      const canvaBlob = response; // Adjust based on your response structure
      
      // Send the Canva blob data to your custom endpoint
      await sendCanvaBlobToBackend(canvaBlob);

    } catch (error) {
      console.log(error);
    } finally {
      setExportState("idle");
    }
  };

  const sendCanvaBlobToBackend = async (canvaBlob) => {
    try {
      const token = await auth.getCanvaUserToken();
      
      const res = await fetch(`${BACKEND_HOST}/api/canva/upload`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: "POST",
        body: JSON.stringify({ exportBlobs: canvaBlob, token }),
      });
  
      const body = await res.json();
  
      // Handle the response from your backend if needed
      console.log("Response from backend:", body);
    } catch (error) {
      console.error("Error sending Canva blob to backend:", error);
    }
  };

  const removeUserConnectionSep7 = async () => {
    try {
      const token = await auth.getCanvaUserToken();
      
      const res = await fetch(`${BACKEND_HOST}/configuration/delete`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: "POST",
        body: JSON.stringify({ token }),
      });
      
      const body = await res.json();
  
      // Handle the response from your backend if needed
      console.log("Response from backend:", body);
      setState("not_authenticated");
    } catch (error) {
      console.error("Error while removing Connection from sep7 Account", error);
    }
  };

  if (state === "error") {
    return (
      <div className={styles.scrollContainer}>
        <Text>
          <Text variant="bold" tagName="span">
            Something went wrong.
          </Text>{" "}
          Check the JavaScript Console for details.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="3u">
        <Box>
          <Text alignment="center">{createAuthenticationMessage(state)}</Text>
        </Box>

        {state !== "authenticated" && (
          <Button variant="primary" onClick={startAuthenticationFlow} disabled={state === "checking"} stretch>
            Start connecting to Sep7
          </Button>
        )}
        
        {state !== "authenticated" && (
          <Text>
            If you are not authenticated, it means that you have not connected your Sep7 account with Canva. 
            Please click the button to proceed with the login/acceptance of the connection process.
          </Text>
        )}

        {state === "authenticated" && (
          <>
            <Button variant="primary" onClick={exportDocument} loading={exportState === "exporting"} stretch>
              Export
            </Button>

            <UserUploads/>
          </>
        )}

        {state == "authenticated" && (
          <Button variant="secondary" onClick={removeUserConnectionSep7} stretch>
            Remove connection of Canva from sep7 Account
          </Button>
        )}
      </Rows>
    </div>
  );
};

const createAuthenticationMessage = (state: State) => {
  switch (state) {
    case "checking":
      return "Checking authentication status...";
    case "authenticated":
      return "You are authenticated!";
    case "not_authenticated":
      return "You are not authenticated.";
  }
};
