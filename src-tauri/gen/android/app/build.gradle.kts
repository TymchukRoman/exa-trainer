import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

val dotenvProperties = Properties().apply {
    // Repo root .env (used by local Android release signing)
    val envFile = file("../../../../.env")
    if (envFile.exists()) {
        envFile.readLines()
            .map { it.trim() }
            .filter { it.isNotEmpty() && !it.startsWith("#") && it.contains("=") }
            .forEach { line ->
                val idx = line.indexOf("=")
                val key = line.substring(0, idx).trim()
                val value = line.substring(idx + 1).trim().trim('"')
                setProperty(key, value)
            }
    }
}

fun envOrDotenv(key: String): String? = System.getenv(key) ?: dotenvProperties.getProperty(key)

fun requireEnvOrDotenv(key: String): String =
    envOrDotenv(key) ?: throw GradleException(
        "Missing $key. Set it in environment variables or in repo root .env.",
    )

fun resolveKeystorePath(rawPath: String): File {
    val candidate = file(rawPath)
    if (candidate.isAbsolute) return candidate

    // Most common local setup keeps keystore in repository root.
    val repoRelative = file("../../../../" + rawPath.removePrefix("./"))
    return if (repoRelative.exists()) repoRelative else candidate
}

android {
    compileSdk = 36
    namespace = "exa.trainer"
    signingConfigs {
        create("release") {
            storeFile = resolveKeystorePath(requireEnvOrDotenv("TAURI_ANDROID_KEYSTORE_PATH"))
            storePassword = requireEnvOrDotenv("TAURI_ANDROID_KEYSTORE_PASSWORD")
            keyAlias = requireEnvOrDotenv("TAURI_ANDROID_KEY_ALIAS")
            keyPassword = requireEnvOrDotenv("TAURI_ANDROID_KEY_PASSWORD")
        }
    }
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "exa.trainer"
        minSdk = 24
        targetSdk = 36
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
    }
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            isMinifyEnabled = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                *fileTree(".") { include("**/*.pro") }
                    .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
                    .toList().toTypedArray()
            )
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")