// import { useRef, useState } from "react";

// import apiCommand from "../api/apiClient";
// //import Header from "../components/home/Header";
// import Sidebar from "../components/home/Sidebar";
// import DataSourceSelector from "../components/home/DataSourceSelector";
// import UploadBox from "../components/home/UploadBox";
// import FileTable from "../components/home/FileTable";
// import type { UploadedFile } from "../components/home/FileTable";
// import UploadProgress from "../components/home/UploadProgress";
// import History from "./History";
// import Profile from "./Profile";

// import "./Home.css";

// type HomeProps = {
//   onLogout: () => void;
// };

// const Home = ({ onLogout }: HomeProps) => {
//   const [selectedSource, setSelectedSource] =
//     useState("Local Storage");

//   const [activeMenu, setActiveMenu] =
//     useState("Home");

//   const [files, setFiles] = useState<
//     UploadedFile[]
//   >([]);

//   const filesRef = useRef<Record<string, File>>({});

//   const CHUNK_SIZE = 5 * 1024 * 1024;

//   const computeChunkHash = async (chunk: Blob) => {
//     const arrayBuffer = await chunk.arrayBuffer();
//     const hashBuffer = await crypto.subtle.digest(
//       "SHA-256",
//       arrayBuffer
//     );
//     const hashArray = Array.from(new Uint8Array(hashBuffer));

//     return hashArray
//       .map((byte) =>
//         byte.toString(16).padStart(2, "0")
//       )
//       .join("");
//   };

//   const formatFileSize = (
//     bytes: number
//   ) => {
//     if (bytes < 1024) {
//       return `${bytes} B`;
//     }

//     if (bytes < 1024 * 1024) {
//       return `${(
//         bytes / 1024
//       ).toFixed(1)} KB`;
//     }

//     return `${(
//       bytes /
//       (1024 * 1024)
//     ).toFixed(1)} MB`;
//   };

//   const uploadFileChunks = async (
//     file: File,
//     id: string
//   ) => {
//     try {
//       const initResponse = await apiCommand<{
//         upload_id: string;
//         chunk_size: number;
//         total_chunks: number;
//       }>({
//         endpoint: "/v1/upload/init",
//         method: "POST",
//         payload: {
//           filename: file.name,
//           filesize: file.size,
//         },
//         requireAuth: true,
//       });

//       const uploadId = initResponse.upload_id;
//       const totalChunks = initResponse.total_chunks;
//       const chunkSize = initResponse.chunk_size || CHUNK_SIZE;

//       for (let i = 0; i < totalChunks; i++) {
//         const start = i * chunkSize;
//         const end = Math.min(
//           start + chunkSize,
//           file.size
//         );
//         const chunk = file.slice(start, end);
//         const chunkHash = await computeChunkHash(chunk);
//         const formData = new FormData();

//         formData.append("upload_id", uploadId);
//         formData.append("chunk_index", String(i));
//         formData.append("chunk_hash", chunkHash);
//         formData.append("chunk_file", chunk, file.name);

//         await apiCommand<{
//           status: string;
//           upload_id: string;
//           chunk_index: number;
//           bytes_received: number;
//           received_chunks: number;
//           total_chunks: number;
//           chunk_size: number;
//           complete: boolean;
//         }>({
//           endpoint: "/v1/upload/chunk",
//           method: "POST",
//           payload: formData,
//           headers: {
//             Range: `bytes ${start}-${end - 1}/${file.size}`,
//           },
//           requireAuth: true,
//         });

//         const progress = Math.round(
//           ((i + 1) / totalChunks) * 100
//         );

//         setFiles((prev) =>
//           prev.map((f) =>
//             f.id === id
//               ? {
//                   ...f,
//                   progress,
//                   totalChunks,
//                   status:
//                     progress === 100
//                       ? "Uploading"
//                       : "Uploading",
//                 }
//               : f
//           )
//         );
//       }

//       await apiCommand<{
//         status: string;
//         upload_id: string;
//         physical_file_id: number;
//         file_path: string;
//         master_hash: string;
//         complete: true;
//       }>({
//         endpoint: "/v1/upload/finalize",
//         method: "POST",
//         payload: {
//           upload_id: uploadId,
//         },
//         requireAuth: true,
//       });

//       setFiles((prev) =>
//         prev.map((f) =>
//           f.id === id
//             ? {
//                 ...f,
//                 progress: 100,
//                 totalChunks,
//                 status: "Done",
//               }
//             : f
//         )
//       );

//       const historyItem = {
//         id,
//         name: file.name,
//         size: formatFileSize(file.size),
//         source: "Local",
//         status: "Done",
//         uploadedAt: new Date().toISOString(),
//         uploadedBy:
//           localStorage.getItem(
//             "ingester-current-user"
//           ) || "-",
//       };

//       try {
//         const histJson = localStorage.getItem(
//           "ingester-history"
//         );
//         const hist = histJson
//           ? JSON.parse(histJson)
//           : [];

//         hist.unshift(historyItem);
//         localStorage.setItem(
//           "ingester-history",
//           JSON.stringify(hist)
//         );
//       } catch {
//         localStorage.setItem(
//           "ingester-history",
//           JSON.stringify([historyItem])
//         );
//       }
//     } catch {
//       setFiles((prev) =>
//         prev.map((f) =>
//           f.id === id
//             ? {
//                 ...f,
//                 status: "Error",
//               }
//             : f
//         )
//       );
//     }
//   };

//   const handleFilesSelected = (
//     selectedFiles: FileList
//   ) => {
//     const incoming: UploadedFile[] = [];
//     const selectedNames = new Set(
//       files.map((file) => file.name.toLowerCase())
//     );

//     try {
//       const histJson = localStorage.getItem(
//         "ingester-history"
//       );
//       const historyItems = histJson
//         ? JSON.parse(histJson)
//         : [];

//       historyItems.forEach((item: { name: string }) => {
//         selectedNames.add(item.name.toLowerCase());
//       });
//     } catch {
//       // ignore invalid history cache
//     }

//     Array.from(selectedFiles).forEach((file) => {
//       const normalizedName = file.name.toLowerCase();
//       const duplicate =
//         selectedNames.has(normalizedName);

//       if (duplicate) {
//         window.alert(
//           `${file.name} has already been uploaded or selected.`
//         );
//         return;
//       }

//       selectedNames.add(normalizedName);

//       const id =
//         Date.now().toString() +
//         Math.random().toString();

//       filesRef.current[id] = file;

//       const totalChunks = Math.ceil(
//         file.size / CHUNK_SIZE
//       );

//       const f: UploadedFile = {
//         id,
//         name: file.name,
//         size: formatFileSize(file.size),
//         source: "Local",
//         status: "Waiting",
//         progress: 0,
//         totalChunks,
//       };

//       uploadFileChunks(file, id);
//       incoming.push(f);
//     });

//     if (incoming.length === 0) return;

//     setFiles((prev) => [...prev, ...incoming]);
//   };

//   const renderContent = () => {
//     if (activeMenu === "History") {
//       return <History />;
//     }

//     if (activeMenu === "Profile") {
//       return <Profile />;
//     }

//     return (
//       <section className="home-content">
//         <div className="welcome-section">
//           <p className="welcome-label">
//             INGESTER PLATFORM
//           </p>

//           <h1>
//             Welcome back,
//           </h1>

//           <p className="welcome-description">
//             Choose a data source to start ingestion
//           </p>
//         </div>

//         <div className="source-section">
//           <DataSourceSelector
//             selectedSource={selectedSource}
//             onSourceSelect={setSelectedSource}
//           />

//           {selectedSource === "Local Storage" && (
//             <UploadBox
//               onFilesSelected={handleFilesSelected}
//             />
//           )}

//           <UploadProgress files={files} />
//         </div>

//         <div className="file-section">
//           <div className="file-header">
//             <div>
//               <h2>Uploaded Files</h2>

//               <p>
//                 Track your ingestion files
//               </p>
//             </div>

//             <span className="file-count">
//               {files.length} Files
//             </span>
//           </div>

//           <FileTable files={files} />
//         </div>
//       </section>
//     );
//   };

//   return (
//     <div className="home-page">
//       <Sidebar
//         activeMenu={activeMenu}
//         onMenuChange={setActiveMenu}
//         onLogout={onLogout}
//       />

//       <main className="main-content">
//       {/* <Header /> */}
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// export default Home;
import { useState } from "react";
import {
  Home as HomeIcon,
  History,
  User,
  LogOut,
  UploadCloud,
  ChevronDown,
} from "lucide-react";

type HomeProps = {
  onLogout: () => void | Promise<void>;
};

function Home({ onLogout }: HomeProps) {
  const [activeMenu, setActiveMenu] = useState("Home");

  return (
    <div className="home-page">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-icon">
            <UploadCloud size={24} />
          </div>

          <div>
            <h2>Ingester</h2>
            <span>Platform</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            className={activeMenu === "Home" ? "menu-item active" : "menu-item"}
            onClick={() => setActiveMenu("Home")}
          >
            <HomeIcon size={20} />
            <span>Home</span>
          </button>

          <button
            className={
              activeMenu === "History" ? "menu-item active" : "menu-item"
            }
            onClick={() => setActiveMenu("History")}
          >
            <History size={20} />
            <span>History</span>
          </button>

          <button
            className={
              activeMenu === "Profile" ? "menu-item active" : "menu-item"
            }
            onClick={() => setActiveMenu("Profile")}
          >
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>

        <button className="logout-button" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* HEADER */}
        <header className="top-header">
          <div>
            <p className="header-label">DATA INGESTION WORKSPACE</p>
            <h1>Welcome back 👋</h1>
            <p className="header-subtitle">
              Select a data source to start your ingestion process.
            </p>
          </div>

          <div className="user-profile">
            <div className="avatar">U</div>

            <div className="user-info">
              <strong>Usha Devi</strong>
              <span>Frontend Engineer</span>
            </div>

            <ChevronDown size={18} />
          </div>
        </header>

        {/* WORKSPACE */}
        <section className="workspace-section">
          <div className="workspace-heading">
            <div>
              <h2>Choose your data source</h2>
              <p>
                Connect your data source and start uploading files securely.
              </p>
            </div>
          </div>

          <div className="source-grid">
            {/* LOCAL STORAGE */}
            <div className="source-card">
              <div className="source-icon local-icon">
                <UploadCloud size={28} />
              </div>

              <h3>Local Storage</h3>

              <p>
                Upload files directly from your local device.
              </p>

              <button className="source-button">
                Select Files
              </button>
            </div>

            {/* GOOGLE DRIVE */}
            <div className="source-card">
              <div className="source-icon drive-icon">
                <span>G</span>
              </div>

              <h3>Google Drive</h3>

              <p>
                Connect and ingest files from your Google Drive.
              </p>

              <button className="source-button">
                Connect Drive
              </button>
            </div>

            {/* SHAREPOINT */}
            <div className="source-card">
              <div className="source-icon sharepoint-icon">
                <span>S</span>
              </div>

              <h3>SharePoint</h3>

              <p>
                Access and ingest files from SharePoint.
              </p>

              <button className="source-button">
                Connect Source
              </button>
            </div>

            {/* SFTP */}
            <div className="source-card">
              <div className="source-icon sftp-icon">
                <span>⇄</span>
              </div>

              <h3>SFTP</h3>

              <p>
                Connect to your secure file transfer server.
              </p>

              <button className="source-button">
                Connect Source
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;