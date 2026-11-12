package com.senai.ProjetoInterdisciplinar.repostory;

import com.senai.ProjetoInterdisciplinar.entity.Leitura;
import com.senai.ProjetoInterdisciplinar.entity.TipoPeca;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeituraRepository extends JpaRepository<Leitura, Long> {

    List<Leitura> findAllByOrderByDataHoraDesc(Pageable pageable);

    Optional<Leitura> findFirstByOrderByDataHoraDesc();

    long countByTipoPecaAndDataHoraGreaterThanEqual(TipoPeca tipoPeca, Instant desde);
}
