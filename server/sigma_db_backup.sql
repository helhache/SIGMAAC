-- Warning: column statistics not supported by the server.
-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: sigma_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activaciones`
--

DROP TABLE IF EXISTS `activaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('Mensual','Semanal','Especial') NOT NULL DEFAULT 'Mensual',
  `desde` date NOT NULL,
  `hasta` date NOT NULL,
  `ean` bigint(20) NOT NULL,
  `descripcion` varchar(200) NOT NULL,
  `dinamica` varchar(100) DEFAULT NULL,
  `dcto` decimal(10,4) DEFAULT NULL,
  `precio_sugerido` decimal(10,2) DEFAULT NULL,
  `precio_oferta` decimal(10,2) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT 1,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `activaciones_ibfk_1` (`ean`),
  CONSTRAINT `activaciones_ibfk_1` FOREIGN KEY (`ean`) REFERENCES `productos` (`ean`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activaciones`
--

LOCK TABLES `activaciones` WRITE;
/*!40000 ALTER TABLE `activaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `activaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asignaciones`
--

DROP TABLE IF EXISTS `asignaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `local_id` int(11) NOT NULL,
  `activacion_id` int(11) NOT NULL,
  `precio_personalizado` decimal(10,2) DEFAULT NULL,
  `activa` tinyint(4) DEFAULT 1,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asignacion` (`local_id`,`activacion_id`),
  KEY `activacion_id` (`activacion_id`),
  CONSTRAINT `asignaciones_ibfk_1` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asignaciones_ibfk_2` FOREIGN KEY (`activacion_id`) REFERENCES `activaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignaciones`
--

LOCK TABLES `asignaciones` WRITE;
/*!40000 ALTER TABLE `asignaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `asignaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cambio_items`
--

DROP TABLE IF EXISTS `cambio_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cambio_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cambio_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `motivo_id` int(11) NOT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `etiquetas_requeridas` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `cambio_id` (`cambio_id`),
  KEY `producto_id` (`producto_id`),
  KEY `motivo_id` (`motivo_id`),
  CONSTRAINT `cambio_items_ibfk_1` FOREIGN KEY (`cambio_id`) REFERENCES `cambios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cambio_items_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `cambio_items_ibfk_3` FOREIGN KEY (`motivo_id`) REFERENCES `motivos_cambio` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cambio_items`
--

LOCK TABLES `cambio_items` WRITE;
/*!40000 ALTER TABLE `cambio_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cambio_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cambios`
--

DROP TABLE IF EXISTS `cambios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cambios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repositor_id` int(11) NOT NULL,
  `local_id` int(11) NOT NULL,
  `numero_vendedor` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `estado` enum('pendiente','aprobado','procesado','rechazado') DEFAULT 'pendiente',
  `notas` text DEFAULT NULL,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `nota_admin` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `repositor_id` (`repositor_id`),
  KEY `local_id` (`local_id`),
  CONSTRAINT `cambios_ibfk_1` FOREIGN KEY (`repositor_id`) REFERENCES `repositores` (`id`),
  CONSTRAINT `cambios_ibfk_2` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cambios`
--

LOCK TABLES `cambios` WRITE;
/*!40000 ALTER TABLE `cambios` DISABLE KEYS */;
/*!40000 ALTER TABLE `cambios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('regional','nacional') NOT NULL DEFAULT 'regional',
  `activo` tinyint(4) DEFAULT 1,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (1,'Tauil','regional',1,'2026-05-11 19:17:51'),(2,'Fiambrissima','regional',1,'2026-05-11 19:17:51'),(3,'Beraca','regional',1,'2026-05-11 19:17:51');
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locales`
--

DROP TABLE IF EXISTS `locales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `numero_local` varchar(20) DEFAULT NULL,
  `tipo` enum('regional','nacional') NOT NULL DEFAULT 'regional',
  `activo` tinyint(4) DEFAULT 1,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_local` (`numero_local`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `locales_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locales`
--

LOCK TABLES `locales` WRITE;
/*!40000 ALTER TABLE `locales` DISABLE KEYS */;
INSERT INTO `locales` VALUES (1,1,'Tauil Casa Central',NULL,'001','regional',1,'2026-05-11 19:17:51'),(2,2,'Fiambrissima Misiones',NULL,'002','regional',1,'2026-05-11 19:17:51'),(3,2,'Fiambrissima Illia',NULL,'003','regional',1,'2026-05-11 19:17:51'),(4,3,'Beraca Dos Avenidas',NULL,'004','regional',1,'2026-05-11 19:17:51'),(5,3,'Beraca San Isidro',NULL,'005','regional',1,'2026-05-11 19:17:51');
/*!40000 ALTER TABLE `locales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_descargas`
--

DROP TABLE IF EXISTS `log_descargas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_descargas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `activacion_id` int(11) DEFAULT NULL,
  `local_id` int(11) DEFAULT NULL,
  `tipo_cartel` varchar(100) DEFAULT NULL,
  `formato` varchar(20) DEFAULT NULL,
  `descargado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `activacion_id` (`activacion_id`),
  KEY `local_id` (`local_id`),
  CONSTRAINT `log_descargas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `log_descargas_ibfk_2` FOREIGN KEY (`activacion_id`) REFERENCES `activaciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `log_descargas_ibfk_3` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_descargas`
--

LOCK TABLES `log_descargas` WRITE;
/*!40000 ALTER TABLE `log_descargas` DISABLE KEYS */;
/*!40000 ALTER TABLE `log_descargas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `motivos_cambio`
--

DROP TABLE IF EXISTS `motivos_cambio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `motivos_cambio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `motivos_cambio`
--

LOCK TABLES `motivos_cambio` WRITE;
/*!40000 ALTER TABLE `motivos_cambio` DISABLE KEYS */;
/*!40000 ALTER TABLE `motivos_cambio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objetivo_empresas`
--

DROP TABLE IF EXISTS `objetivo_empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objetivo_empresas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `objetivo_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `volumen_objetivo` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_obj_emp` (`objetivo_id`,`empresa_id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `objetivo_empresas_ibfk_1` FOREIGN KEY (`objetivo_id`) REFERENCES `objetivos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `objetivo_empresas_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objetivo_empresas`
--

LOCK TABLES `objetivo_empresas` WRITE;
/*!40000 ALTER TABLE `objetivo_empresas` DISABLE KEYS */;
/*!40000 ALTER TABLE `objetivo_empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objetivo_locales`
--

DROP TABLE IF EXISTS `objetivo_locales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objetivo_locales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `objetivo_id` int(11) NOT NULL,
  `local_id` int(11) NOT NULL,
  `volumen_objetivo` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_obj_loc` (`objetivo_id`,`local_id`),
  KEY `local_id` (`local_id`),
  CONSTRAINT `objetivo_locales_ibfk_1` FOREIGN KEY (`objetivo_id`) REFERENCES `objetivos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `objetivo_locales_ibfk_2` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objetivo_locales`
--

LOCK TABLES `objetivo_locales` WRITE;
/*!40000 ALTER TABLE `objetivo_locales` DISABLE KEYS */;
/*!40000 ALTER TABLE `objetivo_locales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objetivo_skus`
--

DROP TABLE IF EXISTS `objetivo_skus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objetivo_skus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `objetivo_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `volumen_objetivo` decimal(10,2) NOT NULL,
  `sovi_objetivo` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_obj_sku` (`objetivo_id`,`producto_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `objetivo_skus_ibfk_1` FOREIGN KEY (`objetivo_id`) REFERENCES `objetivos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `objetivo_skus_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objetivo_skus`
--

LOCK TABLES `objetivo_skus` WRITE;
/*!40000 ALTER TABLE `objetivo_skus` DISABLE KEYS */;
/*!40000 ALTER TABLE `objetivo_skus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objetivos`
--

DROP TABLE IF EXISTS `objetivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objetivos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `periodo` enum('semanal','mensual','anual') NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `volumen_objetivo` decimal(10,2) NOT NULL,
  `unit_general` decimal(10,4) NOT NULL DEFAULT 1.7000,
  `descripcion` varchar(200) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT 1,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `visible_repositores` tinyint(4) DEFAULT 0,
  `visible_volumen` tinyint(4) DEFAULT 1,
  `visible_porcentaje` tinyint(4) DEFAULT 1,
  `volumen_real` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objetivos`
--

LOCK TABLES `objetivos` WRITE;
/*!40000 ALTER TABLE `objetivos` DISABLE KEYS */;
INSERT INTO `objetivos` VALUES (1,'semanal','2026-05-11','2026-05-18',50000.00,1.7000,'objetivo semana 1',0,'2026-05-12 04:39:37',0,1,1,NULL),(2,'anual','2026-01-01','2026-12-31',93000.00,1.7000,'AÑO 2026',1,'2026-05-14 20:09:41',0,1,1,NULL),(3,'mensual','2026-05-01','2026-05-31',25000.00,1.7000,'MAYO 2026',1,'2026-05-14 20:20:23',0,1,1,NULL);
/*!40000 ALTER TABLE `objetivos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedido_items`
--

DROP TABLE IF EXISTS `pedido_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad_bultos` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) DEFAULT NULL,
  `cantidad_display` int(11) DEFAULT NULL,
  `unidad_display` varchar(20) DEFAULT NULL,
  `packs` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `pedido_items_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pedido_items_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido_items`
--

LOCK TABLES `pedido_items` WRITE;
/*!40000 ALTER TABLE `pedido_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedido_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `local_id` int(11) NOT NULL,
  `repositor_id` int(11) DEFAULT NULL,
  `tipo` enum('programado','forzado') NOT NULL DEFAULT 'programado',
  `fecha_pedido` date NOT NULL,
  `fecha_entrega_estimada` date DEFAULT NULL,
  `estado` enum('borrador','confirmado','en_transito','entregado','cancelado') DEFAULT 'borrador',
  `total_bultos` int(11) DEFAULT 0,
  `total_units` decimal(10,4) DEFAULT 0.0000,
  `total_volumen` decimal(10,4) DEFAULT 0.0000,
  `notas` text DEFAULT NULL,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `total_packs` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `local_id` (`local_id`),
  KEY `repositor_id` (`repositor_id`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`),
  CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`repositor_id`) REFERENCES `repositores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ean` bigint(20) NOT NULL,
  `codigo_venta` varchar(4) DEFAULT NULL,
  `nombre` varchar(200) NOT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `sabor` varchar(100) DEFAULT NULL,
  `retornable` tinyint(4) DEFAULT 0,
  `tamano_ml` int(11) DEFAULT NULL,
  `tipo_envase` varchar(20) DEFAULT NULL,
  `material_envase` varchar(20) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `unidades_por_bulto` int(11) DEFAULT NULL,
  `packs_por_capa` int(11) DEFAULT NULL,
  `capas_por_pale` int(11) DEFAULT NULL,
  `unidades_por_pale` int(11) DEFAULT NULL,
  `precio_sugerido` decimal(10,2) DEFAULT NULL,
  `unit_value` decimal(10,4) DEFAULT NULL,
  `litros_por_pack` decimal(8,3) DEFAULT NULL,
  `sovi_requerido` decimal(5,2) DEFAULT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT 1,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ean` (`ean`)
) ENGINE=InnoDB AUTO_INCREMENT=261 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,7790895005176,'101','Coca-Cola 350 ml Ret Vid 24B','Coca-Cola','COLA',1,350,'INDIVIDUAL','VR',NULL,24,10,6,60,NULL,1.4794,8.400,NULL,NULL,1,'2026-05-12 21:04:17'),(2,7790895001598,'103','Coca-Cola 1 Ltro. Ret. Vid. 8B','Coca-Cola','COLA',1,1000,'FAMILIAR','VR',NULL,8,10,5,50,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:17'),(3,7790895005916,'104','Coca-Cola 1.5 Lts. Ret. Vid. 8B','Coca-Cola','COLA',1,1500,'FAMILIAR','VR',NULL,8,10,5,50,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:17'),(4,7790895000782,'107','Coca-Cola 500 ml NR Pet 12B','Coca-Cola','COLA',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:17'),(5,7790895002656,'116','Coca-Cola 375 ml NR Pet 12B','Coca-Cola','COLA',0,375,'INDIVIDUAL','PET',NULL,12,28,8,224,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:17'),(7,7790895650833,'120','Coca-Cola 600 ml NR Pet 12B','Coca-Cola','COLA',0,600,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.2680,7.200,NULL,NULL,1,'2026-05-12 21:04:17'),(8,7790895000218,'125','Coca-Cola 2 Lts. Ret Pet 8B','Coca-Cola','COLA',1,2000,'FAMILIAR','RP',NULL,8,10,5,50,NULL,2.8178,16.000,NULL,NULL,1,'2026-05-12 21:04:17'),(9,7790895068164,'130','Coca-Cola 2.5 Lts. Ret Pet 8B','Coca-Cola','COLA',1,2500,'FAMILIAR','RP',NULL,8,10,5,50,NULL,3.5223,20.000,NULL,NULL,1,'2026-05-12 21:04:17'),(10,7790895065712,'145','Coca-Cola BIB 20 Lts. 1B','Coca-Cola','COLA',0,20000,'FAMILIAR','BIB',NULL,1,10,4,40,NULL,22.5431,20.000,NULL,NULL,1,'2026-05-12 21:04:17'),(11,7790895000232,'173','Coca-Cola 354ml NR 6 Latas','Coca-Cola','COLA',0,354,'INDIVIDUAL','CAN',NULL,6,45,11,495,NULL,0.3741,2.124,NULL,NULL,1,'2026-05-12 21:04:17'),(12,7790895063855,'182','Coca-Cola 250 ml NR Pet 12B','Coca-Cola','COLA',0,250,'INDIVIDUAL','PET',NULL,12,33,9,297,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:17'),(13,7790895005794,'189','Coca-Cola LS 2.5 Lts. NR Pet 6B','Coca-Cola','COLA',0,2500,'FAMILIAR','PET',NULL,6,15,5,75,NULL,2.6417,15.000,NULL,NULL,1,'2026-05-12 21:04:17'),(14,7790895000430,'326','Coca-Cola LS 1.5 Lts. NR Pet 6B','Coca-Cola','COLA',0,1500,'FAMILIAR','PET',NULL,6,24,5,120,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:17'),(15,7790895000997,'327','Coca-Cola LS 2.25 Lts. NR Pet 6B','Coca-Cola','COLA',0,2250,'FAMILIAR','PET',NULL,6,20,5,100,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:17'),(16,7790895006418,'331','Coca-Cola LS 3 Lts. NR Pet 6B','Coca-Cola','COLA',0,3000,'FAMILIAR','PET',NULL,6,15,5,75,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:17'),(17,7790895000010,'356','Coca-Cola LS 2 Lts. NR Pet 6B','Coca-Cola','COLA',0,2000,'FAMILIAR','PET',NULL,6,20,5,100,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:17'),(18,7790895003035,'603','Coca-Cola Zero 1 Ltro. Ret. Vid. 8B','Coca-Cola Zero','COLA',1,1000,'FAMILIAR','VR',NULL,8,10,5,50,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:17'),(19,7790895067600,'608','Coca-Cola Zero 350 ml Ret Vid 24B','Coca-Cola Zero','COLA',1,350,'INDIVIDUAL','VR',NULL,24,10,6,60,NULL,1.4794,8.400,NULL,NULL,1,'2026-05-12 21:04:17'),(20,7790895067532,'611','Coca-Cola Zero 500 ml NR Pet 12B','Coca-Cola Zero','COLA',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:17'),(21,7790895639937,'614','Coca-Cola Zero 1.5 Lts. Ret Vid 8B','Coca-Cola Zero','COLA',1,1500,'FAMILIAR','VR',NULL,8,10,5,50,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:17'),(22,7790895067617,'615','Coca-Cola Zero 2 Lts. Ret Pet 8B','Coca-Cola Zero','COLA',1,2000,'FAMILIAR','RP',NULL,8,10,5,50,NULL,2.8178,16.000,NULL,NULL,1,'2026-05-12 21:04:17'),(23,7790895000935,'622','Coca-Cola Zero 250ml NR Pet 12B','Coca-Cola Zero','COLA',0,250,'INDIVIDUAL','PET',NULL,12,33,9,297,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:17'),(24,7790895650840,'623','COCA-COLA ZERO 600 ML NR 6B','Coca-Cola Zero','COLA',0,600,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.6340,3.600,NULL,NULL,1,'2026-05-12 21:04:17'),(25,7790895639951,'630','Coca-Cola Zero 2.5 Lts. Ret Pet 8B','Coca-Cola Zero','COLA',1,2500,'FAMILIAR','RP',NULL,8,10,5,50,NULL,3.5223,20.000,NULL,NULL,1,'2026-05-12 21:04:17'),(26,7790895008108,'631','Coca-Cola Zero 375 ml NR Pet 6B Decorado','Coca-Cola Zero','COLA',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:17'),(27,7790895067556,'652','Coca-Cola Zero 1.5 Lts. NR Pet 6B','Coca-Cola Zero','COLA',0,1500,'FAMILIAR','PET',NULL,6,24,5,120,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:17'),(28,7790895067570,'655','Coca-Cola Zero 2.25 Lts. NR Pet 6B','Coca-Cola Zero','COLA',0,2250,'FAMILIAR','PET',NULL,6,20,5,100,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:17'),(29,7790895067563,'656','Coca-Cola Zero 2 Lts. NR Pet 6B','Coca-Cola Zero','COLA',0,2000,'FAMILIAR','PET',NULL,6,20,5,100,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:17'),(30,7790895067587,'676','Coca-Cola Zero 354ml NR 6 Latas','Coca-Cola Zero','COLA',0,354,'INDIVIDUAL','CAN',NULL,6,45,11,495,NULL,0.3741,2.124,NULL,NULL,1,'2026-05-12 21:04:17'),(31,7790895003660,'683','Coca-Cola Zero BIB 10 Lts. 1B','Coca-Cola Zero','COLA',0,10000,'FAMILIAR','BIB',NULL,1,15,4,60,NULL,11.2785,10.000,NULL,NULL,1,'2026-05-12 21:04:17'),(32,7790895067709,'1101','Fanta Naranja 350 ml Ret Vid 24B','Fanta','NARANJA',1,350,'INDIVIDUAL','VR',NULL,24,10,6,60,NULL,1.4794,8.400,NULL,NULL,1,'2026-05-12 21:04:17'),(33,7790895067716,'1103','Fanta Naranja 1 Ltro. Ret. Vid. 8B','Fanta','NARANJA',1,1000,'FAMILIAR','VR',NULL,8,10,5,50,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:17'),(34,7790895000836,'1107','Fanta Naranja 500 ml NR Pet 12B','Fanta','NARANJA',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:17'),(36,7790895011559,'1118','Fanta Naranja 375 ml NR Pet 6B','Fanta','NARANJA',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:17'),(37,7790895064111,'1121','Fanta Naranja 3 Lts. NR Pet 6B','Fanta','NARANJA',0,3000,'FAMILIAR','PET',NULL,6,15,5,75,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:17'),(38,7790895000331,'1125','Fanta Naranja 2 Lts. Ret Pet 8B','Fanta','NARANJA',1,2000,'FAMILIAR','RP',NULL,8,10,5,50,NULL,2.8178,16.000,NULL,NULL,1,'2026-05-12 21:04:17'),(39,7790895647260,'1126','Fanta Naranja 250 ml NR Pet 12B','Fanta','NARANJA',0,250,'INDIVIDUAL','PET',NULL,12,33,9,297,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:17'),(40,7790895640261,'1130','Fanta Naranja 2.5 Lts. Ret Pet 8B','Fanta','NARANJA',1,2500,'FAMILIAR','RP',NULL,8,10,5,50,NULL,3.5223,20.000,NULL,NULL,1,'2026-05-12 21:04:17'),(41,7790895000454,'1190','Fanta Naranja 1.5 Lts. NR Pet 6B','Fanta','NARANJA',0,1500,'FAMILIAR','PET',NULL,6,24,5,120,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(42,7790895001017,'1195','Fanta Naranja 2.25 Lts. NR Pet 6B','Fanta','NARANJA',0,2250,'FAMILIAR','PET',NULL,6,20,5,100,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(43,7790895001055,'1208','Fanta Pomelo NF 500 ml NR Pet 6B','Fanta','POMELO',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(44,7790895650307,'1228','Fanta Pomelo NF 375 ml NR Pet 6B','Fanta','POMELO',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:18'),(45,7790895647925,'1268','Fanta Pomelo NF 2.5 Lts. NR Pet 6B','Fanta','POMELO',0,2500,'FAMILIAR','PET',NULL,6,15,5,75,NULL,2.6417,15.000,NULL,NULL,1,'2026-05-12 21:04:18'),(46,7790895001048,'1408','Fanta Limon Dulce 500 ml NR Pet 6B','Fanta','LIMON',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(47,7790895000089,'1421','Fanta Limon Dulce 2.0 Lts. Ret Pet 8B','Fanta','LIMON',1,2000,'FAMILIAR','RP',NULL,8,10,5,50,NULL,2.8178,16.000,NULL,NULL,1,'2026-05-12 21:04:18'),(48,7790895649912,'1428','Fanta Limon Dulce 375 ml NR Pet 6B','Fanta','LIMON',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:18'),(49,7790895648366,'1489','Fanta Limon Dulce 2.5 Lts. NR Pet 6B','Fanta','LIMON',0,2500,'FAMILIAR','PET',NULL,6,15,5,75,NULL,2.6417,15.000,NULL,NULL,1,'2026-05-12 21:04:18'),(50,7790895649660,'1503','Fanta Manzana 1 Ltro Ret. Vid 8B','Fanta','MANZANA',1,1000,'FAMILIAR','VR',NULL,8,10,5,50,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:18'),(51,7790895650208,'1508','Fanta Manzana 500 ml NR Pet 6B','Fanta','MANZANA',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(52,7790895647109,'1528','Fanta Manzana 375 ml NR Pet 6B','Fanta','MANZANA',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:18'),(53,7790895647963,'1589','Fanta Manzana 2.5 Lts. NR Pet 6B','Fanta','MANZANA',0,2500,'FAMILIAR','PET',NULL,6,15,5,75,NULL,2.6417,15.000,NULL,NULL,1,'2026-05-12 21:04:18'),(54,7790895642692,'1645','Fanta Naranja Zero BIB 10 Lts. 1B','Fanta Zero','NARANJA',0,10000,'FAMILIAR','BIB',NULL,1,15,4,60,NULL,9.5104,10.000,NULL,NULL,1,'2026-05-12 21:04:18'),(55,7790895002304,'1650','Fanta Zero 1.5 Lts. NR Pet 6B','Fanta Zero','NARANJA',0,1500,'FAMILIAR','PET',NULL,6,24,5,120,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(56,7790895004308,'1675','Fanta Zero 354ml NR 6 Latas','Fanta Zero','NARANJA',0,354,'INDIVIDUAL','CAN',NULL,6,45,11,495,NULL,0.3741,2.124,NULL,NULL,1,'2026-05-12 21:04:18'),(57,7790895651243,'1703','Fanta Misterio Chucky 473ml NR 6 Latas','Fanta','MISTERIO',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(58,7790895067693,'2301','Sprite F LS 350 ml Ret Vid 24B','Sprite','LIMA LIMON',1,350,'INDIVIDUAL','VR',NULL,24,10,6,60,NULL,1.4794,8.400,NULL,NULL,1,'2026-05-12 21:04:18'),(59,7790895063022,'2403','Sprite F LS 1 Ltro. Ret. Vid. 8B','Sprite','LIMA LIMON',1,1000,'FAMILIAR','VR',NULL,8,10,5,50,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:18'),(60,7790895000829,'2408','Sprite F LS 500 ml NR Pet 6B','Sprite','LIMA LIMON',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(62,7790895012471,'2418','Sprite F LS 375 ml NR Pet 6B','Sprite','LIMA LIMON',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:18'),(63,7790895000447,'2421','Sprite F LS 1.5 Lts. NR Pet 6B','Sprite','LIMA LIMON',0,1500,'FAMILIAR','PET',NULL,6,24,5,120,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(64,7790895000225,'2425','Sprite F LS 2 Lts. Ret Pet 8B','Sprite','LIMA LIMON',1,2000,'FAMILIAR','RP',NULL,8,10,5,50,NULL,2.8178,16.000,NULL,NULL,1,'2026-05-12 21:04:18'),(65,7790895001000,'2427','Sprite F LS 2.25 Lts. NR Pet 6B','Sprite','LIMA LIMON',0,2250,'FAMILIAR','PET',NULL,6,20,5,100,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(66,7790895004384,'2430','Sprite F LS 2.5 Lts. Ret Pet 8B','Sprite','LIMA LIMON',1,2500,'FAMILIAR','RP',NULL,8,10,5,50,NULL,3.5223,20.000,NULL,NULL,1,'2026-05-12 21:04:18'),(67,7790895064128,'2431','Sprite F LS 3 Lts. NR Pet 6B','Sprite','LIMA LIMON',0,3000,'FAMILIAR','PET',NULL,6,15,5,75,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:18'),(68,7790895065637,'2445','Sprite F Zero BIB 10 Lts. 1B','Sprite Zero','LIMA LIMON',0,10000,'FAMILIAR','BIB',NULL,1,15,4,60,NULL,11.2716,10.000,NULL,NULL,1,'2026-05-12 21:04:18'),(69,7790895000270,'2475','Sprite F LS 354ml NR 6 Latas','Sprite','LIMA LIMON',0,354,'INDIVIDUAL','CAN',NULL,6,45,11,495,NULL,0.3741,2.124,NULL,NULL,1,'2026-05-12 21:04:18'),(70,7790895641640,'2482','Sprite F LS 250 ml NR Pet 12B','Sprite','LIMA LIMON',0,250,'INDIVIDUAL','PET',NULL,12,33,9,297,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(71,7790895064173,'2491','Sprite F Zero 1.5 Lts. NR Pet 6B','Sprite Zero','LIMA LIMON',0,1500,'FAMILIAR','PET',NULL,6,24,5,120,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(72,7790895647727,'2680','Benedictino s/gas 500 ml Ret Vid 15B','Benedictino','AGUA S/GAS',1,500,'INDIVIDUAL','VR',NULL,15,10,5,50,NULL,1.3209,7.500,NULL,NULL,1,'2026-05-12 21:04:18'),(73,7790895647741,'2681','Benedictino s/gas 600 ml NR Pet 12B','Benedictino','AGUA S/GAS',0,600,'INDIVIDUAL','PET',NULL,12,22,7,154,NULL,1.2680,7.200,NULL,NULL,1,'2026-05-12 21:04:18'),(74,7790895647703,'2682','Benedictino s/gas 2 Lts. NR Pet 6B','Benedictino','AGUA S/GAS',0,2000,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:18'),(75,7790895647789,'2683','Benedictino s/gas 6.25 Lts. NR Pet 1B','Benedictino','AGUA S/GAS',0,6250,'FAMILIAR','BID',NULL,1,42,4,168,NULL,1.1007,6.250,NULL,NULL,1,'2026-05-12 21:04:18'),(76,7790895648564,'2684','Benedictino s/gas 3 Lts. NR Pet 6B','Benedictino','AGUA S/GAS',0,3000,'FAMILIAR','PET',NULL,6,15,4,60,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:18'),(77,7790895647734,'2780','Benedictino c/gas 500 ml Ret Vid 15B','Benedictino','AGUA C/GAS',1,500,'INDIVIDUAL','VR',NULL,15,10,5,50,NULL,1.3209,7.500,NULL,NULL,1,'2026-05-12 21:04:18'),(78,7790895647758,'2781','Benedictino c/gas 600 ml NR Pet 12B','Benedictino','AGUA C/GAS',0,600,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.2680,7.200,NULL,NULL,1,'2026-05-12 21:04:18'),(79,7790895647796,'2782','Soda Benedictino Sifón 2.0 Lts NR Pet 6B','Benedictino','AGUA C/GAS',0,2000,'FAMILIAR','SIF',NULL,6,20,5,100,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:18'),(80,7790895647710,'2783','Soda Benedictino 2 Lts. NR Pet 6B','Benedictino','AGUA C/GAS',0,2000,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:18'),(81,7790895643903,'3024','Schweppes Pomelo Zero Lata 310 ml 6B','Schweppes Zero','POMELO',0,310,'INDIVIDUAL','CAN',NULL,6,56,11,616,NULL,0.3276,1.860,NULL,NULL,1,'2026-05-12 21:04:18'),(82,7790895010095,'3042','Schweppes Pomelo Zero 2.25 Lts NR Pet 6B','Schweppes Zero','POMELO',0,2250,'FAMILIAR','PET',NULL,6,20,5,100,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(83,7790895003202,'3124','Schweppes Tonica Lata 310 ml 6B','Schweppes','TONICA',0,310,'INDIVIDUAL','CAN',NULL,6,56,11,616,NULL,0.3276,1.860,NULL,NULL,1,'2026-05-12 21:04:18'),(84,7790895004667,'3175','Schweppes Tonica 2.25 Lts. NR Pet 6B','Schweppes','TONICA',0,2250,'FAMILIAR','PET',NULL,6,20,5,100,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(85,7790895643019,'3297','Crush Naranja 3 Lts. NR Pet 6B','Crush','NARANJA',0,3000,'FAMILIAR','PET',NULL,6,15,5,75,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:18'),(86,7790895643026,'3397','Crush Pomelo 3 Lts. NR Pet 6B','Crush','POMELO',0,3000,'FAMILIAR','PET',NULL,6,15,5,75,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:18'),(87,7790895643033,'3496','Crush Lima-Limon S/Az. 3 Lts. NR Pet 6B','Crush','LIMA LIMON',0,3000,'FAMILIAR','PET',NULL,6,15,5,75,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:18'),(88,7790895644320,'3596','Crush Manzana S/Az. 3 Lts. NR Pet 6B','Crush','MANZANA',0,3000,'FAMILIAR','PET',NULL,6,15,5,75,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:18'),(89,7790895647369,'3819','Cepita Fresh Naranja 500 ml NR Pet 12B','Cepita Fresh','NARANJA',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(90,7790895647376,'3820','Cepita Fresh Pomelo 500 ml NR Pet 12B','Cepita Fresh','POMELO',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(93,7790895646751,'3834','Cepita Fresh Manzana 1.5 Lts. NR Pet 6B','Cepita Fresh','MANZANA',0,1500,'FAMILIAR','PET',NULL,6,24,4,96,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(94,7790895646737,'3835','Cepita Fresh Naranja 1.5 Lts. NR Pet 6B','Cepita Fresh','NARANJA',0,1500,'FAMILIAR','PET',NULL,6,24,4,96,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(95,7790895646775,'3836','Cepita Fresh Pomelo 1.5 Lts. NR Pet 6B','Cepita Fresh','POMELO',0,1500,'FAMILIAR','PET',NULL,6,24,4,96,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(96,7790895648700,'3838','Cepita Fresh Naranja 3 Lts. NR Pet 6B','Cepita Fresh','NARANJA',0,3000,'FAMILIAR','PET',NULL,6,15,4,60,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:18'),(97,7790895650000,'3839','Cepita Fresh Pomelo 3 Lts. NR Pet 6B','Cepita Fresh','POMELO',0,3000,'FAMILIAR','PET',NULL,6,15,4,60,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:18'),(98,7790895641794,'3840','Cepita Naranja 300ml NR Pet 6B','Cepita','NARANJA',0,300,'INDIVIDUAL','PET',NULL,6,63,10,630,NULL,0.3170,1.800,NULL,NULL,1,'2026-05-12 21:04:18'),(99,7790895641541,'3842','Cepita Durazno 300 ml NR Pet 6B','Cepita','DURAZNO',0,300,'INDIVIDUAL','PET',NULL,6,63,10,630,NULL,0.3170,1.800,NULL,NULL,1,'2026-05-12 21:04:18'),(100,7790895641800,'3845','Cepita Naranja 1.5 Lts. NR Pet 4B','Cepita','NARANJA',0,1500,'FAMILIAR','PET',NULL,4,42,4,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(101,7790895641749,'3846','Cepita Anana 1.5 Lts. NR Pet 4B','Cepita','PIÑA',0,1500,'FAMILIAR','PET',NULL,4,42,4,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(102,7790895641534,'3847','Cepita Durazno 1.5 Lts. NR Pet 4B','Cepita','DURAZNO',0,1500,'FAMILIAR','PET',NULL,4,42,4,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(103,7790895004933,'3848','Cepita Manzana 1.5 Lts. NR Pet 4B','Cepita','MANZANA',0,1500,'FAMILIAR','PET',NULL,4,42,4,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(104,7790895649264,'3849','Cepita Anana-Mandarina 1 Ltro. NR Pet 6B','Cepita','ANANA MANDARINA',0,1000,'FAMILIAR','PET',NULL,6,23,7,161,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(105,7790895009815,'3850','Cepita Naranja 1 Ltro. NR Pet 6B','Cepita','NARANJA',0,1000,'FAMILIAR','PET',NULL,6,23,7,161,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(106,7790895649257,'3851','Cepita Frutilla-Mango 300ml NR Pet 6B','Cepita','FRUTILLA MANGO',0,300,'INDIVIDUAL','PET',NULL,6,63,10,630,NULL,0.3170,1.800,NULL,NULL,1,'2026-05-12 21:04:18'),(107,7790895009846,'3852','Cepita Durazno 1 Ltro. NR Pet 6B','Cepita','DURAZNO',0,1000,'FAMILIAR','PET',NULL,6,23,7,161,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(108,7790895649240,'3855','Cepita Frutilla-Mango 1 Ltro. NR Pet 6B','Cepita','FRUTILLA MANGO',0,1000,'FAMILIAR','PET',NULL,6,23,7,161,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(109,1007084701235,'3860','Monster Energy Green 473ml NR 6 Latas','Monster Energy','ENERGY',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(110,1007084789387,'3861','Monster Energy Ultra 473ml NR 6 Latas','Monster Energy','ENERGY',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(111,1007084703475,'3862','Monster E. Mango Loco 473ml NR 6 Latas','Monster Energy','ENERGY',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(112,1007084703703,'3865','Monster E Ultra Sunrise 473ml NR 6 Latas','Monster Energy','ENERGY',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(113,1007084702751,'3866','Monster Energy Rossi 473ml NR 6 Latas','Monster Energy','ENERGY',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(114,1007084703123,'3867','Monster E U. Watermelon 473ml NR 6 Latas','Monster Energy','ENERGY',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(115,1007084789417,'3868','Monster R.W. Pineapple 473ml NR 6 Latas','Monster Energy','ENERGY',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(116,7798422620090,'3869','Monster E. Green Zero 473ml NR 6 Latas','Monster Energy','ENERGY',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(117,7798422620120,'3870','Monster Pipeline Punch 473ml NR 6 Latas','Monster Energy','ENERGY',0,473,'INDIVIDUAL','CAN',NULL,6,45,9,405,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(118,7790895000720,'3920','Cepita Manzana 25% 200ml TB 6B','Cepita','MANZANA',0,200,'INDIVIDUAL','TTB',NULL,6,80,9,720,NULL,0.2113,1.200,NULL,NULL,1,'2026-05-12 21:04:18'),(119,7790895000737,'3923','Cepita Multifruta 25% 200ml TB 6B','Cepita','TUTTIFRUTI',0,200,'INDIVIDUAL','TTB',NULL,6,80,9,720,NULL,0.2113,1.200,NULL,NULL,1,'2026-05-12 21:04:18'),(120,7790895641596,'3924','Cepita Naranja 25% 200ml TB 6B','Cepita','NARANJA',0,200,'INDIVIDUAL','TTB',NULL,6,80,9,720,NULL,0.2113,1.200,NULL,NULL,1,'2026-05-12 21:04:18'),(121,7790895647017,'3993','Cepita Manzana 25% 1 Ltro. Tetra 6B','Cepita','MANZANA',0,1000,'FAMILIAR','TTB',NULL,6,30,5,150,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(122,7790895647123,'3995','Cepita Multifruta 25% 1 Ltro. Tetra 6B','Cepita','TUTTIFRUTI',0,1000,'FAMILIAR','TTB',NULL,6,30,5,150,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(123,7790895646560,'3997','Cepita Naranja 25% 1 Ltro. Tetra 6B','Cepita','NARANJA',0,1000,'FAMILIAR','TTB',NULL,6,30,5,150,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(124,7790895640018,'4053','Powerade Manzana 500 ml NR Pet 6B','Powerade','MANZANA',0,500,'INDIVIDUAL','PET',NULL,6,45,7,315,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(125,7790895640025,'4055','Powerade Mountain Blast 500 ml NR Pet 6B','Powerade','MOUNTAIN BLAST',0,500,'INDIVIDUAL','PET',NULL,6,45,7,315,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(126,7790895641183,'4059','Powerade Frutas Trop. 500 ml NR Pet 6B','Powerade','FRUTAS TROPICALES',0,500,'INDIVIDUAL','PET',NULL,6,45,7,315,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(127,7790895648687,'4067','Powerade Uva 500 ml NR Pet 6B','Powerade','UVA',0,500,'INDIVIDUAL','PET',NULL,6,45,7,315,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(128,7790895651052,'4070','Powerade Sour Green A. 500 ml NR Pet 6B','Powerade','MANZANA VERDE',0,500,'INDIVIDUAL','PET',NULL,6,45,7,315,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(129,7790895006029,'4075','Powerade Mountain Blast 995 ml NR Pet 6B','Powerade','MOUNTAIN BLAST',0,995,'INDIVIDUAL','PET',NULL,6,32,5,160,NULL,1.0514,5.970,NULL,NULL,1,'2026-05-12 21:04:18'),(130,7790895006036,'4076','Powerade Manzana 995 ml NR Pet 6B','Powerade','MANZANA',0,995,'INDIVIDUAL','PET',NULL,6,32,5,160,NULL,1.0514,5.970,NULL,NULL,1,'2026-05-12 21:04:18'),(131,7790895006104,'4079','Powerade Frutas Trop. 995 ml NR Pet 6B','Powerade','FRUTAS TROPICALES',0,995,'INDIVIDUAL','PET',NULL,6,32,5,160,NULL,1.0514,5.970,NULL,NULL,1,'2026-05-12 21:04:18'),(132,7790895640469,'4202','Aquarius Pomelo 500 ml NR Pet 12B','Aquarius','POMELO',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(133,7790895640445,'4204','Aquarius Pera 500 ml NR Pet 12B','Aquarius','PERA',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(134,7790895640452,'4206','Aquarius Manzana 500 ml NR Pet 12B','Aquarius','MANZANA',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(136,7790895641213,'4208','Aquarius Naranja 500 ml NR Pet 12B','Aquarius','NARANJA',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(139,7790895004032,'4212','Aquarius Pomelo Rosado 500 ml NR Pet 12B','Aquarius','POMELO ROSADO',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(142,7790895649943,'4218','Aquarius Pera 500 ml Ret Vid 15B','Aquarius','PERA',1,500,'INDIVIDUAL','VR',NULL,15,10,5,50,NULL,1.3209,7.500,NULL,NULL,1,'2026-05-12 21:04:18'),(143,7790895649950,'4219','Aquarius Pom.Rosado 500 ml Ret Vid 15B','Aquarius','POMELO ROSADO',1,500,'INDIVIDUAL','VR',NULL,15,10,5,50,NULL,1.3209,7.500,NULL,NULL,1,'2026-05-12 21:04:18'),(144,7790895651151,'4220','Aquarius Anana-Jeng. 1.5 Lts. NR Pet 6B','Aquarius','ANANA-JENGIBRE',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(145,7790895640490,'4221','Aquarius Pomelo 1.5 Lts. NR Pet 6B','Aquarius','POMELO',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(146,7790895640476,'4223','Aquarius Pera 1.5 Lts. NR Pet 6B','Aquarius','PERA',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(147,7790895640483,'4225','Aquarius Manzana 1.5 Lts. NR Pet 6B','Aquarius','MANZANA',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(148,7790895008498,'4226','Aquarius Limonada 1.5 Lts. NR Pet 6B','Aquarius','LIMONADA',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(149,7790895641237,'4227','Aquarius Naranja 1.5 Lts. NR Pet 6B','Aquarius','NARANJA',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(150,7790895641220,'4229','Aquarius Uva 1.5 Lts. NR Pet 6B','Aquarius','UVA',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(151,7790895004049,'4230','Aquarius Pom.Rosado 1.5 Lts. NR Pet 6B','Aquarius','POMELO ROSADO',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(152,7790895003288,'4231','Aquarius Pomelo 2.25 Lts. NR Pet 6B','Aquarius','POMELO',0,2250,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(153,7790895003295,'4233','Aquarius Pera 2.25 Lts. NR Pet 6B','Aquarius','PERA',0,2250,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(154,7790895003301,'4235','Aquarius Manzana 2.25 Lts. NR Pet 6B','Aquarius','MANZANA',0,2250,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(155,7790895008504,'4236','Aquarius Limonada 2.25 Lts. NR Pet 6B','Aquarius','LIMONADA',0,2250,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(156,7790895003325,'4237','Aquarius Naranja 2.25 Lts. NR Pet 6B','Aquarius','NARANJA',0,2250,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(157,7790895004971,'4240','Aquarius Pom.Rosado 2.25 Lts. NR Pet 6B','Aquarius','POMELO ROSADO',0,2250,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(158,7790895646607,'4245','Aquarius Naranja 2.0 Lts. Ret Pet 8B','Aquarius','NARANJA',1,2000,'FAMILIAR','RP',NULL,8,10,5,50,NULL,2.8178,16.000,NULL,NULL,1,'2026-05-12 21:04:18'),(159,7790895646621,'4247','Aquarius Pomelo 2.0 Lts. Ret Pet 8B','Aquarius','POMELO',1,2000,'FAMILIAR','RP',NULL,8,10,5,50,NULL,2.8178,16.000,NULL,NULL,1,'2026-05-12 21:04:18'),(160,7790895646638,'4248','Aquarius Pera 2.0 Lts. Ret Pet 8B','Aquarius','PERA',1,2000,'FAMILIAR','RP',NULL,8,10,5,50,NULL,2.8178,16.000,NULL,NULL,1,'2026-05-12 21:04:18'),(161,7790895648410,'4249','Aquarius Pom. Rosado 2.0 Lts. Ret Pet 8B','Aquarius','POMELO ROSADO',1,2000,'FAMILIAR','RP',NULL,8,10,5,50,NULL,2.8178,16.000,NULL,NULL,1,'2026-05-12 21:04:18'),(162,7790895643194,'4292','Aquarius Pomelo 375 ml NR Pet 6B','Aquarius','POMELO',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:18'),(163,7790895643231,'4294','Aquarius Pera 375 ml NR Pet 6B','Aquarius','PERA',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:18'),(164,7790895643255,'4298','Aquarius Naranja 375 ml NR Pet 6B','Aquarius','NARANJA',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:18'),(165,7790895649745,'4299','Aquarius Pomelo Rosado 375 ml NR Pet 6B','Aquarius','POMELO ROSADO',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:04:18'),(166,7790895648908,'4570','Dualpack Coca-Cola+Fanta Nar 2.25L Pet6B','Mixtos','MIXTOS',0,2250,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(167,7790895006890,'4571','Dualpack Coca-Cola+Sprite F 2.25L Pet6B','Mixtos','MIXTOS',0,2250,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(168,7790895648915,'4572','Dualpack Coca-Cola+Coca Zero 2.25L Pet6B','Mixtos','MIXTOS',0,2250,'FAMILIAR','PET',NULL,6,20,4,80,NULL,2.3775,13.500,NULL,NULL,1,'2026-05-12 21:04:18'),(169,7790895650802,'4574','Dual Bened.+Bened. SG 3 Lts. NR Pet 6B','Mixtos','MIXTOS',0,3000,'FAMILIAR','PET',NULL,6,15,4,60,NULL,3.1701,18.000,NULL,NULL,1,'2026-05-12 21:04:18'),(170,7790895650949,'4575','Dualpack Coca-Cola+Sprite 1.5L NR Pet6B','Mixtos','MIXTOS',0,1500,'FAMILIAR','PET',NULL,6,24,4,96,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(171,7790895651199,'4576','Dual Aq. Pera+Aq. Pera 1.5L NR Pet6B','Mixtos','MIXTOS',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(172,7790895651205,'4577','Dual Aq. PoRos+Aq. PoRos 1.5L NR Pet6B','Mixtos','MIXTOS',0,1500,'FAMILIAR','PET',NULL,6,28,4,112,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(173,7790895643835,'4745','AdeS Manzana F 1 Ltro. Tetra 8B','AdeS','MANZANA',0,1000,'FAMILIAR','TTB',NULL,8,21,5,105,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:18'),(174,7790895643842,'4746','AdeS Naranja F 1 Ltro. Tetra 8B','AdeS','NARANJA',0,1000,'FAMILIAR','TTB',NULL,8,21,5,105,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:18'),(175,7790895643866,'4747','AdeS Frutas Trop F 1 Ltro. Tetra 8B','AdeS','FRUTAS TROPICALES',0,1000,'FAMILIAR','TTB',NULL,8,21,5,105,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:18'),(176,7790895643828,'4748','AdeS Durazno F 1 Ltro. Tetra 8B','AdeS','DURAZNO',0,1000,'FAMILIAR','TTB',NULL,8,21,5,105,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:18'),(177,7790895643804,'4749','AdeS Ananá F 1 Ltro. Tetra 8B','AdeS','PIÑA',0,1000,'FAMILIAR','TTB',NULL,8,21,5,105,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:18'),(178,7790895649837,'4780','AdeS Natural F 1 Ltro. TB 8B','AdeS','NATURAL',0,1000,'FAMILIAR','TTB',NULL,8,21,5,105,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:18'),(179,7790895649806,'4781','AdeS Almendra F 1 Ltro. TB 8B','AdeS','ALMENDRA',0,1000,'FAMILIAR','TTB',NULL,8,21,5,105,NULL,1.4089,8.000,NULL,NULL,1,'2026-05-12 21:04:18'),(180,7790895643743,'4785','AdeS Manzana F 200ml TB 6B','AdeS','MANZANA',0,200,'INDIVIDUAL','TTB',NULL,6,84,9,756,NULL,0.2113,1.200,NULL,NULL,1,'2026-05-12 21:04:18'),(181,7790895643750,'4786','AdeS Naranja F 200ml TB 6B','AdeS','NARANJA',0,200,'INDIVIDUAL','TTB',NULL,6,84,9,756,NULL,0.2113,1.200,NULL,NULL,1,'2026-05-12 21:04:18'),(182,7790895643767,'4787','AdeS Frutas Trop F 200ml TB 6B','AdeS','FRUTAS TROPICALES',0,200,'INDIVIDUAL','TTB',NULL,6,84,9,756,NULL,0.2113,1.200,NULL,NULL,1,'2026-05-12 21:04:18'),(183,7790895643729,'4788','AdeS Durazno F 200ml TB 6B','AdeS','DURAZNO',0,200,'INDIVIDUAL','TTB',NULL,6,84,9,756,NULL,0.2113,1.200,NULL,NULL,1,'2026-05-12 21:04:18'),(184,7790895643712,'4789','AdeS Ananá F 200ml TB 6B','AdeS','PIÑA',0,200,'INDIVIDUAL','TTB',NULL,6,84,9,756,NULL,0.2113,1.200,NULL,NULL,1,'2026-05-12 21:04:18'),(185,7798338291056,'5050','Las 3 Niñas Chocolatada 200ml TB 12B','Las 3 Niñas','CHOCOLATADA',0,200,'INDIVIDUAL','TTB',NULL,12,42,9,378,NULL,0.4227,2.400,NULL,NULL,1,'2026-05-12 21:04:18'),(186,7798338291049,'5051','Las 3 Niñas Chocolatada 1L TB 06B','Las 3 Niñas','CHOCOLATADA',0,1000,'FAMILIAR','TTB',NULL,6,30,5,150,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(187,7798338291612,'5055','Las 3 Niñas Leche Pri. Años 1L TB 6B','Las 3 Niñas','LECHE FORMULA',0,1000,'FAMILIAR','TTB',NULL,6,30,5,150,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(188,7798338291629,'5056','Las 3 Niñas Leche Pri. Años 200ml TB 12B','Las 3 Niñas','LECHE FORMULA',0,200,'INDIVIDUAL','TTB',NULL,12,42,9,378,NULL,0.4227,2.400,NULL,NULL,1,'2026-05-12 21:04:18'),(189,7798338290035,'5100','Las 3 Niñas Leche Descremada 1L TB 12B','Las 3 Niñas','LECHE DESCREMADA',0,1000,'FAMILIAR','TTB',NULL,12,15,6,90,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:18'),(190,7798338291469,'5101','Las 3 Niñas Leche Clasica Liv. 1L TB 12B','Las 3 Niñas','LECHE CLASICA',0,1000,'FAMILIAR','TTB',NULL,12,15,5,75,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:18'),(191,7798338290271,'5102','Las 3 Niñas Leche 0% Lactosa 1L TB 12B','Las 3 Niñas','LECHE DESLACTOSADA',0,1000,'FAMILIAR','TTB',NULL,12,17,4,68,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:18'),(192,7798338291070,'5150','Las 3 Niñas Crema P/Cocinar 200ml TB 12B','Las 3 Niñas','CREMA DE LECHE',0,200,'INDIVIDUAL','TTB',NULL,12,42,9,378,NULL,0.4227,2.400,NULL,NULL,1,'2026-05-12 21:04:18'),(193,7798338291087,'5151','Las 3 Niñas Crema P/Batir 200ml TB 12B','Las 3 Niñas','CREMA DE LECHE',0,200,'INDIVIDUAL','TTB',NULL,12,42,9,378,NULL,0.4227,2.400,NULL,NULL,1,'2026-05-12 21:04:18'),(194,7791120103681,'5153','Las 3 Niñas Cereales Cacao 100gr 12P','Las 3 Niñas','CACAO',0,100,'INDIVIDUAL','BOL',NULL,12,10,8,80,NULL,NULL,1.200,NULL,NULL,1,'2026-05-12 21:04:18'),(195,7798338291551,'5154','Las 3 Niñas & Yo Frutilla 500gr TB 6B','Las 3 Niñas','FRUTILLA',0,500,'INDIVIDUAL','TTB',NULL,6,34,9,306,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(196,7798338291520,'5155','Las 3 Niñas & Yo Frutilla 190gr TB 12B','Las 3 Niñas','FRUTILLA',0,190,'INDIVIDUAL','TTB',NULL,12,42,9,378,NULL,0.4015,2.280,NULL,NULL,1,'2026-05-12 21:04:18'),(197,7798338291544,'5156','Las 3 Niñas & Yo Vainilla 500gr TB 6B','Las 3 Niñas','VAINILLA',0,500,'INDIVIDUAL','TTB',NULL,6,34,9,306,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(198,7798338291537,'5157','Las 3 Niñas & Yo Vainilla 190gr TB 12B','Las 3 Niñas','VAINILLA',0,190,'INDIVIDUAL','TTB',NULL,12,42,9,378,NULL,0.4015,2.280,NULL,NULL,1,'2026-05-12 21:04:18'),(199,7798338291223,'5158','Las 3 Niñas Crema P/Cocinar 500ml TB 6B','Las 3 Niñas','CREMA DE LECHE',0,500,'INDIVIDUAL','TTB',NULL,6,34,9,306,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(200,7798338291247,'5159','Las 3 Niñas Crema P/Batir 500ml TB 6B','Las 3 Niñas','CREMA DE LECHE',0,500,'INDIVIDUAL','TTB',NULL,6,34,9,306,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:04:18'),(201,7798338291339,'5160','Las 3 Niñas Crema Rosa 190ml TB 12B','Las 3 Niñas','CREMA SABORIZADA',0,190,'INDIVIDUAL','TTB',NULL,12,42,9,378,NULL,0.4015,2.280,NULL,NULL,1,'2026-05-12 21:04:18'),(202,7798338291346,'5161','Las 3 Niñas Crema 4 Quesos 190ml TB 12B','Las 3 Niñas','CREMA SABORIZADA',0,190,'INDIVIDUAL','TTB',NULL,12,42,9,378,NULL,0.4015,2.280,NULL,NULL,1,'2026-05-12 21:04:18'),(203,7798338291353,'5162','Las 3 Niñas Crema Hongos 190ml TB 12B','Las 3 Niñas','CREMA SABORIZADA',0,190,'INDIVIDUAL','TTB',NULL,12,42,9,378,NULL,0.4015,2.280,NULL,NULL,1,'2026-05-12 21:04:18'),(204,7798339250663,'6601','Rabieta American IPA 710ml NR Vid 6B','Rabieta','CERVEZA',0,710,'INDIVIDUAL','VNR',NULL,6,28,5,140,NULL,0.7502,4.260,NULL,NULL,1,'2026-05-12 21:04:18'),(205,7798339250687,'6602','Rabieta Red Irish Ale 710ml NR Vid 6B','Rabieta','CERVEZA',0,710,'INDIVIDUAL','VNR',NULL,6,28,5,140,NULL,0.7502,4.260,NULL,NULL,1,'2026-05-12 21:04:18'),(206,7798339250717,'6603','Rabieta Red Honey 710ml NR Vid 6B','Rabieta','CERVEZA',0,710,'INDIVIDUAL','VNR',NULL,6,28,5,140,NULL,0.7502,4.260,NULL,NULL,1,'2026-05-12 21:04:18'),(207,7798339250748,'6604','Rabieta Helles Munich 710ml NR Vid 6B','Rabieta','CERVEZA',0,710,'INDIVIDUAL','VNR',NULL,6,28,5,140,NULL,0.7502,4.260,NULL,NULL,1,'2026-05-12 21:04:18'),(208,7798339251219,'6605','Rabieta American IPA 473ml NR 6 Latas','Rabieta','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(209,7798339251226,'6606','Rabieta Golden Ale 473ml NR 6 Latas','Rabieta','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(210,7798339251233,'6607','Rabieta Red Irish Ale 473ml NR 6 Latas','Rabieta','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(211,7798339251240,'6608','Rabieta Red Honey 473ml NR 6 Latas','Rabieta','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(212,7798339251264,'6609','Rabieta Helles Munich 473ml NR 6 Latas','Rabieta','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(213,7798339251189,'6610','Pampa B. IPA 473ml NR 6 Latas','Pampa','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(214,7798339251196,'6611','Pampa B. Dorada Pamp. 473ml NR 6 Latas','Pampa','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(215,7798339251202,'6612','Pampa B. Amber Ale 473ml NR 6 Latas','Pampa','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(216,7798339251387,'6613','Pampa B. Honey 473ml NR 6 Latas','Pampa','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(217,7798339251578,'6614','Pampa B. N Cream Stout 473ml NR 6 Latas','Pampa','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(218,7798339251592,'6615','Guinness Extra Stout 473ml NR 6 Latas','Guinness','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(219,7798339251554,'6616','Guinness H.H. 13 Lager 473ml NR 6 Latas','Guinness','CERVEZA',0,473,'INDIVIDUAL','CAN',NULL,6,40,9,360,NULL,0.4998,2.838,NULL,NULL,1,'2026-05-12 21:04:18'),(220,7891136057029,'6668','Aperol Aperitivo 750ml NR Vid 6B','Aperol','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,28,5,140,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(221,7891136052000,'6669','Campari Aperitivo 750ml NR Vid 12B','Campari','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,12,15,5,75,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(222,7791200000565,'6670','Campari Aperitivo 450ml NR Vid 12B','Campari','ALCOHOL',0,450,'INDIVIDUAL','VNR',NULL,12,19,5,95,NULL,0.9510,5.400,NULL,NULL,1,'2026-05-12 21:04:18'),(223,7791200200767,'6671','Cazalis Leg Aperitivo 950ml NR Vid 12B','Cazalis','ALCOHOL',0,950,'FAMILIAR','VNR',NULL,12,14,4,56,NULL,2.0077,11.400,NULL,NULL,1,'2026-05-12 21:04:18'),(224,7791200000619,'6672','Cynar H Proof Aperitivo 750ml NR Vid 6B','Cynar','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,28,5,140,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(225,7791200200538,'6673','Cinzano BI Amer. VTH 1 Ltro. NR Vid 12B','Cinzano','ALCOHOL',0,1000,'FAMILIAR','VNR',NULL,12,11,5,55,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:18'),(226,7791200200552,'6674','Cinzano Rosso VTH 1 Ltro. NR Vid 12B','Cinzano','ALCOHOL',0,1000,'FAMILIAR','VNR',NULL,12,11,5,55,NULL,2.1134,12.000,NULL,NULL,1,'2026-05-12 21:04:18'),(227,7791200200729,'6675','Cinzano To Spritz VTH 750ml NR Vid 6B','Cinzano','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,22,4,88,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(228,7791200200712,'6676','Cinzano Segundo VTH 750ml NR Vid 6B','Cinzano','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,28,5,140,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(229,7501035011335,'6677','J Cuervo Tequila Skull 750ml NR Vid 12B','Jose Cuervo','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,12,14,4,56,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(230,7501035010109,'6678','J Cuervo Tequila Rep. 750ml NR Vid 12B','Jose Cuervo','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,12,14,4,56,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(231,7798131200613,'6679','Old Smug Añejo Whisky 1 Ltro. NR Vid 6B','Old Smuggler','ALCOHOL',0,1000,'FAMILIAR','VNR',NULL,6,16,4,64,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:04:18'),(232,7790197120218,'6680','San Juan Reserva Cognac 750ml NR Vid 6B','Reserva San Juan','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,16,4,64,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(233,897076002010,'6681','Bulldog Gin 700ml NR Vid 6B','Bulldog','ALCOHOL',0,700,'FAMILIAR','VNR',NULL,6,20,6,120,NULL,0.7397,4.200,NULL,NULL,1,'2026-05-12 21:04:18'),(234,7791200000213,'6682','Skyy Vodka 750ml NR Vid 12B','Skyy','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,12,17,5,85,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(235,7791200200583,'6683','Skyy Vodka Inf Framb. 750ml NR Vid 12B','Skyy Infussion','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,12,17,5,85,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(236,7791200200774,'6684','Skyy Vodka Inf B Oran. 750ml NR Vid 12B','Skyy Infussion','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,12,17,5,85,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(237,7791200200606,'6685','Skyy Vodka Inf Apricot 750ml NR Vid 12B','Skyy Infussion','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,12,17,5,85,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(238,7791200200620,'6686','Skyy Vodka Inf Pineap. 750ml NR Vid 12B','Skyy Infussion','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,12,17,5,85,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(239,7791200200811,'6687','Skyy Vodka Inf Cosmic 750ml NR Vid 12B','Skyy Infussion','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,12,17,5,85,NULL,1.5850,9.000,NULL,NULL,1,'2026-05-12 21:04:18'),(240,7790703205491,'6761','Famiglia Cs 750 ml NR Vid 6B','Famiglia','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,28,4,112,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(241,7790703205675,'6762','Famiglia Malbec 750 ml NR Vid 6B','Famiglia','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,28,4,112,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(242,7790703204968,'6765','Don Valentin Red 750 ml NR Vid 6B','Don Valentin','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,30,5,150,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(243,7790703204982,'6766','Don Valentin White 750 ml NR Vid 6B','Don Valentin','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,30,5,150,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(244,7790703205064,'6767','Don Valentin Malbec 750 ml NR Vid 6B','Don Valentin','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,30,5,150,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(245,7790703205095,'6768','Don Valentin Cab Sauv 750 ml NR Vid 6B','Don Valentin','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,30,5,150,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(246,7790703206221,'6769','Il Caprone Malbec 750 ml NR Vid 6B','Il Caprone','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,28,4,112,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(247,7790703206269,'6770','Il Caprone Cs 750 ml NR Vid 6B','Il Caprone','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,28,4,112,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(248,7790703205293,'6771','New Age White 750 ml NR Vid 6B','New Age','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,30,5,150,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(249,7790703205224,'6772','Marlo Dulce 750 ml NR Vid 6B','Marlo','ALCOHOL',0,750,'FAMILIAR','VNR',NULL,6,30,5,150,NULL,0.7925,4.500,NULL,NULL,1,'2026-05-12 21:04:18'),(250,7790895002656,'118','Coca-Cola 375 ml NR Pet 6B','Coca-Cola','COLA',0,375,'INDIVIDUAL','PET',NULL,6,56,8,448,NULL,0.3963,2.250,NULL,NULL,1,'2026-05-12 21:09:42'),(251,7790895000836,'1110','FANTA NARANJA 500 ML NR PET 6B','Fanta','NARANJA',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:09:42'),(252,7790895000829,'2410','Sprite F LS 500 ml NR Pet 12B','Sprite','LIMA LIMON',0,500,'INDIVIDUAL','PET',NULL,12,24,7,168,NULL,1.0567,6.000,NULL,NULL,1,'2026-05-12 21:09:42'),(253,7790895647369,'3822','Cepita Fresh Naranja 500 ml NR Pet 6B','Cepita Fresh','NARANJA',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:09:42'),(254,7790895647376,'3827','Cepita Fresh Pomelo 500 ml NR Pet 6B','Cepita Fresh','POMELO',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:09:42'),(255,7790895640469,'4207','Aquarius Pomelo 500 ml NR Pet 6B','Aquarius','POMELO',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:09:42'),(256,7790895641213,'4209','Aquarius Naranja 500 ml NR Pet 6B','Aquarius','NARANJA',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:09:42'),(257,7790895640452,'4211','Aquarius Manzana 500 ml NR Pet 6B','Aquarius','MANZANA',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:09:42'),(258,7790895004032,'4213','Aquarius Pomelo Rosado 500 ml NR Pet 6B','Aquarius','POMELO ROSADO',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:09:42'),(259,7790895640445,'4215','Aquarius Pera 500 ml NR Pet 6B','Aquarius','PERA',0,500,'INDIVIDUAL','PET',NULL,6,48,7,336,NULL,0.5283,3.000,NULL,NULL,1,'2026-05-12 21:09:42'),(260,7791120103667,'5152','Las 3 Niñas Tostada Arroz Clas 150gr 12P','Las 3 Niñas','ARROZ',0,150,'INDIVIDUAL','BOL',NULL,12,10,9,90,NULL,NULL,1.800,NULL,NULL,1,'2026-05-12 21:09:42');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reclamos`
--

DROP TABLE IF EXISTS `reclamos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reclamos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `remitente_id` int(11) NOT NULL,
  `remitente_rol` enum('LOCAL','REPOSITOR') NOT NULL,
  `local_id` int(11) NOT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `descripcion` text NOT NULL,
  `estado` enum('abierto','en_revision','resuelto','cerrado') DEFAULT 'abierto',
  `resolucion` text DEFAULT NULL,
  `fecha` date NOT NULL,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `remitente_id` (`remitente_id`),
  KEY `local_id` (`local_id`),
  CONSTRAINT `reclamos_ibfk_1` FOREIGN KEY (`remitente_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `reclamos_ibfk_2` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reclamos`
--

LOCK TABLES `reclamos` WRITE;
/*!40000 ALTER TABLE `reclamos` DISABLE KEYS */;
/*!40000 ALTER TABLE `reclamos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repositores`
--

DROP TABLE IF EXISTS `repositores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repositores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `numero_vendedor` varchar(20) NOT NULL,
  `activo` tinyint(4) DEFAULT 1,
  `objetivo_semanal` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  UNIQUE KEY `numero_vendedor` (`numero_vendedor`),
  CONSTRAINT `repositores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repositores`
--

LOCK TABLES `repositores` WRITE;
/*!40000 ALTER TABLE `repositores` DISABLE KEYS */;
INSERT INTO `repositores` VALUES (1,7,'pancho','barrionuevo','347764',1,NULL);
/*!40000 ALTER TABLE `repositores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repositores_locales`
--

DROP TABLE IF EXISTS `repositores_locales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repositores_locales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repositor_id` int(11) NOT NULL,
  `local_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_repo_local` (`repositor_id`,`local_id`),
  KEY `local_id` (`local_id`),
  CONSTRAINT `repositores_locales_ibfk_1` FOREIGN KEY (`repositor_id`) REFERENCES `repositores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `repositores_locales_ibfk_2` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repositores_locales`
--

LOCK TABLES `repositores_locales` WRITE;
/*!40000 ALTER TABLE `repositores_locales` DISABLE KEYS */;
INSERT INTO `repositores_locales` VALUES (1,1,1);
/*!40000 ALTER TABLE `repositores_locales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas`
--

DROP TABLE IF EXISTS `tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repositor_id` int(11) NOT NULL,
  `tipo` enum('foto','precio','estado','otro') NOT NULL DEFAULT 'otro',
  `descripcion` text NOT NULL,
  `estado` enum('pendiente','completada') DEFAULT 'pendiente',
  `respuesta` text DEFAULT NULL,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `respondido_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `repositor_id` (`repositor_id`),
  CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`repositor_id`) REFERENCES `repositores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (1,1,'precio','pasar fotos de los precios del dual pack','pendiente',NULL,'2026-05-12 21:36:54',NULL);
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_cartel`
--

DROP TABLE IF EXISTS `tipos_cartel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_cartel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `orientacion` enum('vertical','horizontal') DEFAULT 'vertical',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_cartel`
--

LOCK TABLES `tipos_cartel` WRITE;
/*!40000 ALTER TABLE `tipos_cartel` DISABLE KEYS */;
INSERT INTO `tipos_cartel` VALUES (1,'Promo','Cartel de promoción general','vertical'),(2,'Ahorro','Cartel de precio ahorro','vertical'),(3,'Lanzamiento','Cartel de nuevo producto','vertical'),(4,'SuperCombo','Cartel de combo especial','vertical'),(5,'Horizontal','Cartel horizontal con dos logos','horizontal');
/*!40000 ALTER TABLE `tipos_cartel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('ADMIN','GERENTE','LOCAL','REPOSITOR') NOT NULL,
  `nombre_display` varchar(150) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT 1,
  `creado_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'admin.sigma','$2b$10$YpJtu75zIgaU.iVYSlJ5Ye3TngGF4rqVRnMVNfh.8hukHyBjWiX.O','ADMIN','Administrador SIGMA',1,'2026-05-11 19:17:51','2026-05-15 16:34:15'),(5,'local.tauil','$2b$10$IpVGQWhzrBBK5FziQ4vqsePshKj/A0eApL1y.Vwa.1zA8pNqk9E1K','LOCAL','local.tauil',1,'2026-05-12 02:41:42','2026-05-13 16:57:22'),(7,'repo_1','$2b$10$iufZgwLdXeulmOSdpsOnAu4Rbww4.Xgc1mATkHICs/7ybaDZAguXO','REPOSITOR','repo_1',1,'2026-05-12 21:35:41','2026-05-14 17:40:44');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios_locales`
--

DROP TABLE IF EXISTS `usuarios_locales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_locales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `local_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_local` (`usuario_id`,`local_id`),
  KEY `local_id` (`local_id`),
  CONSTRAINT `usuarios_locales_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `usuarios_locales_ibfk_2` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_locales`
--

LOCK TABLES `usuarios_locales` WRITE;
/*!40000 ALTER TABLE `usuarios_locales` DISABLE KEYS */;
INSERT INTO `usuarios_locales` VALUES (3,5,1);
/*!40000 ALTER TABLE `usuarios_locales` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-15 16:45:56
