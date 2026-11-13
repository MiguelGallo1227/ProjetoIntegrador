package com.senai.ProjetoInterdisciplinar.repostory;

import com.senai.ProjetoInterdisciplinar.entity.LeituraSensor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeituraSensorRepository extends JpaRepository<LeituraSensor, Long> {

    List<LeituraSensor> findAllByOrderByDataHoraDesc(Pageable pageable);

    List<LeituraSensor> findByPortaOrderByDataHoraDesc(Integer porta, Pageable pageable);
}
