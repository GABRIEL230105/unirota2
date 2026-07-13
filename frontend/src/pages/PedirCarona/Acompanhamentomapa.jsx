import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "./styles.css";


const pickupIcon = L.divIcon({

  className: "",

  html: `<div class="pin-pickup"></div>`,

  iconSize: [20,20],

  iconAnchor:[10,10],

});



const carroIcon = L.divIcon({

  className:"",

  html:`<div class="pin-carro">🚗</div>`,

  iconSize:[36,36],

  iconAnchor:[18,18],

});




function lerp(a,b,t){

  return a + (b-a)*t;

}




function AjustarVisao({pontoA,pontoB}){

  const map = useMap();


  useEffect(()=>{


    const bounds = L.latLngBounds([
      pontoA,
      pontoB
    ]);


    map.fitBounds(bounds,{
      padding:[70,70]
    });


  },[pontoA,pontoB,map]);


  return null;

}





export default function AcompanhamentoMapa({
  pickup,
  motorista,
  onCancelar
}) {


  const origemMotorista = useRef({

    lat: pickup.lat + 0.007,

    lng: pickup.lng + 0.007,

  });



  const [posicaoCarro,setPosicaoCarro] =
    useState(origemMotorista.current);



  const [progresso,setProgresso] =
    useState(0);



  const [tempoRestante,setTempoRestante] =
    useState(
      motorista.tempoChegadaMin
    );



  const [embarqueConfirmado,setEmbarqueConfirmado] =
    useState(false);




  useEffect(()=>{


    const totalPassos = 30;

    let passo = 0;



    const intervalo = setInterval(()=>{


      passo++;


      const t = Math.min(
        passo / totalPassos,
        1
      );



      setPosicaoCarro({

        lat:lerp(
          origemMotorista.current.lat,
          pickup.lat,
          t
        ),

        lng:lerp(
          origemMotorista.current.lng,
          pickup.lng,
          t
        ),

      });



      setProgresso(t);



      setTempoRestante(

        Math.max(
          Math.round(
            motorista.tempoChegadaMin *
            (1-t)
          ),
          0
        )

      );



      if(t>=1){

        clearInterval(intervalo);

      }



    },700);



    return ()=>clearInterval(intervalo);


  },[pickup,motorista]);





  const chegou = progresso >= 1;





  return (

    <div className="mapa-wrap">


      <MapContainer

        center={[
          pickup.lat,
          pickup.lng
        ]}

        zoom={15}

        scrollWheelZoom={false}

        className="mapa-leaflet"

      >


        <TileLayer

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

          attribution="&copy; OpenStreetMap"

        />



        <Marker

          position={[
            pickup.lat,
            pickup.lng
          ]}

          icon={pickupIcon}

        />



        <Marker

          position={[
            posicaoCarro.lat,
            posicaoCarro.lng
          ]}

          icon={carroIcon}

        />



        <AjustarVisao

          pontoA={[
            pickup.lat,
            pickup.lng
          ]}

          pontoB={[
            posicaoCarro.lat,
            posicaoCarro.lng
          ]}

        />


      </MapContainer>





      <div className="mapa-card-motorista">



        <div className="mapa-status">


          {
            chegou

            ?

            "🚗 Aluno motorista chegou"

            :

            `🚗 Chegando em ${tempoRestante} min`

          }


        </div>






        <div className="mapa-motorista-info">


          <div className="mapa-avatar">

            {motorista.nome.charAt(0)}

          </div>





          <div className="mapa-motorista-texto">


            <strong>

              {motorista.nome}

            </strong>


            <span>

              {motorista.carro}
              {" · "}
              {motorista.placa}

            </span>


            <small>

              Contribuição:
              {" "}
              R$ {motorista.valorAceito ?? 0},00

            </small>



          </div>






          <div className="mapa-nota">

            ⭐ {motorista.nota}

          </div>




        </div>





        {
          chegou && !embarqueConfirmado && (

            <button

              className="mapa-confirmar"

              onClick={() =>
                setEmbarqueConfirmado(true)
              }

            >

              ✅ Confirmar embarque

            </button>

          )

        }





        {
          embarqueConfirmado && (

            <div className="embarque-ok">

              🚌 Viagem iniciada

            </div>

          )

        }





        <button

          className="mapa-cancelar"

          onClick={onCancelar}

        >

          Cancelar carona

        </button>




      </div>


    </div>

  );

}