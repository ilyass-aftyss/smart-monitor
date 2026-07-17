use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;

struct Backend(Mutex<Option<Child>>);

impl Drop for Backend {
  fn drop(&mut self) {
    if let Some(mut child) = self.0.lock().unwrap().take() {
      let _ = child.kill();
      let _ = child.wait();
    }
  }
}

const BACKEND_BIN: &str = "backend-x86_64-pc-windows-gnu.exe";

fn find_backend(app: &tauri::App) -> PathBuf {
  let candidates = vec![
    app.path().resource_dir().ok().map(|p| p.join("binaries").join(BACKEND_BIN)),
    Some(PathBuf::from("binaries").join(BACKEND_BIN)),
    std::env::current_exe().ok().and_then(|p| {
      p.parent().map(|dir| dir.join(BACKEND_BIN))
    }),
    std::env::current_exe().ok().and_then(|p| {
      p.parent().map(|dir| dir.join("binaries").join(BACKEND_BIN))
    }),
  ];
  for c in &candidates {
    if let Some(ref p) = c {
      if p.exists() {
        log::info!("Backend found at: {:?}", p);
        return p.clone();
      }
    }
  }
  let fallback = PathBuf::from("binaries").join(BACKEND_BIN);
  log::warn!("Backend not found, falling back to: {:?}", fallback);
  fallback
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let backend_path = find_backend(app);
      log::info!("Starting backend: {:?}", backend_path);
      let child = Command::new(&backend_path).spawn().unwrap_or_else(|e| {
        log::error!("Failed to start backend.exe: {}", e);
        panic!("Failed to start backend.exe: {}", e);
      });

      app.manage(Backend(Mutex::new(Some(child))));
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
