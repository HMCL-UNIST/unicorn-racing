---
title: Wireshark를 이용한 LiDAR 센서 IP 주소 확인 방법
author: yunho-lee
date: 2026-02-02 12:00:00 +0900
categories: [general, debug]
tags: [lidar]
image:
  path: /assets/img/posts/lidar-ip-address-wireshark/lidar-overview.png
lang: ko
lang_ref: lidar-ip-address-wireshark
---

LiDAR 센서를 PC에 연결하기 위해서는 **센서에 설정된 IP 주소를 확인**해야 합니다. 이 글에서는 Wireshark를 활용하여 센서의 IP 주소 및 IP 대역을 파악하는 방법을 소개합니다.

## Wireshark 설치

센서의 IP 주소 및 **센서가 속한 IP 대역을 파악하기 위해 Wireshark를 활용할 수 있습니다.** (예: 192.168.0.10)

Wireshark 공식 홈페이지에서 다운로드하여 사용 중인 OS에 맞게 설치합니다.

- 공식 사이트: [https://www.wireshark.org/](https://www.wireshark.org/)

사용 중인 OS가 Windows라면 위 링크에서 .exe를 설치할 수 있습니다.

사용 중인 OS가 Ubuntu라면 아래의 명령어로 간단하게 설치 및 실행이 가능합니다.

> **sudo apt install wireshark**
>
> **sudo wireshark**
{: .prompt-tip }

## 센서 IP 확인 방법

PC와 센서를 이더넷으로 연결하면 아래 이미지와 같이 **현재 PC에 연결된 네트워크 인터페이스 목록이 표시됩니다.**

![Wireshark 네트워크 인터페이스 목록](/assets/img/posts/lidar-ip-address-wireshark/wireshark-interfaces.png)

이 중에서 **센서가 연결된 이더넷 인터페이스를 선택하여 패킷을 캡처하면**, 센서가 주기적으로 데이터를 송신하고 있는 것을 확인할 수 있습니다.

이때 패킷 목록의 **Source IP 주소를 확인하면 센서가 사용 중인 IP 주소를 알 수 있으며**, 이를 통해 **센서가 속한 IP 대역(예: 192.168.0.x)을 유추할 수 있습니다.**

![Wireshark 패킷 캡처 화면](/assets/img/posts/lidar-ip-address-wireshark/wireshark-packet-capture.png)

위 예시에서는 Source IP가 192.168.0.10으로 표시되며, 이는 **해당 LiDAR 센서에 설정된 IP 주소**를 의미합니다.

## 마무리

이 글에서는 LiDAR 센서의 IP 주소를 모를 때 Wireshark를 이용하여 확인하는 방법을 다뤘습니다. 센서를 이더넷으로 연결한 뒤 Wireshark에서 패킷의 Source IP를 확인하면 센서의 IP 주소와 대역을 쉽게 파악할 수 있습니다.

> IP 주소 확인 후에는 PC의 네트워크 설정에서 동일 대역의 IP를 수동으로 할당해야 센서와 정상적으로 통신할 수 있습니다.
{: .prompt-info }